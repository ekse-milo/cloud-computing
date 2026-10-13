FROM mysql:8.0

# Copy initialization SQL script to docker-entrypoint-initdb.d
# Scripts in this directory run automatically when container initializes with a clean volume
COPY init.sql /docker-entrypoint-initdb.d/init.sql

# Copy the raw dataset CSV into MySQL secure files directory
COPY quotes.csv /var/lib/mysql-files/quotes.csv

EXPOSE 3306
