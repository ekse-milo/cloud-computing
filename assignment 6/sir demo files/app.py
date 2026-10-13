import os
import time

from flask import Flask, request, jsonify, render_template, redirect, url_for, flash
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.exc import OperationalError, IntegrityError

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "dev-secret-change-me")

# --- DB config comes from environment variables, set at `docker run` time ---
DB_USER = os.environ.get("DB_USER", "root")
DB_PASSWORD = os.environ.get("DB_PASSWORD", "password")
DB_HOST = os.environ.get("DB_HOST", "localhost")   # this will be the DB container's name
DB_PORT = os.environ.get("DB_PORT", "3302")
DB_NAME = os.environ.get("DB_NAME", "testdb")

app.config["SQLALCHEMY_DATABASE_URI"] = (
    f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)


# --- Model ---
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)

    def to_dict(self):
        return {"id": self.id, "name": self.name, "email": self.email}


# --- Web UI (input + display) ---
@app.route("/")
def home():
    users = User.query.order_by(User.id.desc()).all()
    return render_template("index.html", users=users)


@app.route("/add", methods=["POST"])
def add_user():
    name = request.form.get("name", "").strip()
    email = request.form.get("email", "").strip()

    if not name or not email:
        flash("Name and email are both required.", "error")
        return redirect(url_for("home"))

    try:
        user = User(name=name, email=email)
        db.session.add(user)
        db.session.commit()
        flash(f"Added {name}.", "success")
    except IntegrityError:
        db.session.rollback()
        flash(f"A user with email '{email}' already exists.", "error")

    return redirect(url_for("home"))


@app.route("/delete/<int:user_id>", methods=["POST"])
def delete_user_form(user_id):
    user = User.query.get_or_404(user_id)
    db.session.delete(user)
    db.session.commit()
    flash(f"Deleted {user.name}.", "success")
    return redirect(url_for("home"))


# --- JSON API (unchanged, still available for programmatic use) ---
@app.route("/users", methods=["GET"])
def get_users():
    users = User.query.all()
    return jsonify([u.to_dict() for u in users])


@app.route("/users/<int:user_id>", methods=["GET"])
def get_user(user_id):
    user = User.query.get_or_404(user_id)
    return jsonify(user.to_dict())


@app.route("/users", methods=["POST"])
def create_user():
    data = request.get_json(force=True)
    if not data or "name" not in data or "email" not in data:
        return jsonify({"error": "name and email are required"}), 400

    user = User(name=data["name"], email=data["email"])
    db.session.add(user)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "a user with that email already exists"}), 409
    return jsonify(user.to_dict()), 201


@app.route("/users/<int:user_id>", methods=["DELETE"])
def delete_user(user_id):
    user = User.query.get_or_404(user_id)
    db.session.delete(user)
    db.session.commit()
    return "", 204


def init_db(max_retries=15, delay_seconds=3):
    """
    The app container often starts before MySQL is ready to accept
    connections, so retry table creation a few times before giving up.
    """
    attempt = 0
    while attempt < max_retries:
        try:
            with app.app_context():
                db.create_all()
            print("Database connected and tables created.")
            return
        except OperationalError as e:
            attempt += 1
            print(e)
            print(f"Database not ready yet, retrying ({attempt}/{max_retries})...")
            time.sleep(delay_seconds)
    raise RuntimeError("Could not connect to the database after several retries.")


if __name__ == "__main__":
    init_db()
    app.run(host="0.0.0.0", port=5000, debug=True)
