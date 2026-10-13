FROM python:3.11-slim
 
WORKDIR /app
 
COPY requirements.txt .
RUN pip install -r requirements.txt
 
COPY app.py .
COPY templates/ templates/
COPY static/ static/
 
ENV DB_USER=root
ENV DB_PASSWORD=password
ENV DB_HOST=localhost
ENV DB_PORT=3306
ENV DB_NAME=testdb
ENV SECRET_KEY=dev-secret-change-me
 
EXPOSE 5000
 
CMD ["python", "app.py"]