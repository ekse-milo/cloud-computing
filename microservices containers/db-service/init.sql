-- WORDS. — MySQL Database Initialization Script
CREATE DATABASE IF NOT EXISTS quotes_db;
USE quotes_db;

DROP TABLE IF EXISTS quotes;

CREATE TABLE quotes (
    id INT PRIMARY KEY,
    text TEXT NOT NULL,
    author VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    year VARCHAR(50),
    characterCount INT,
    licenseType VARCHAR(255),
    context TEXT
);

LOAD DATA INFILE '/var/lib/mysql-files/quotes.csv'
INTO TABLE quotes
FIELDS TERMINATED BY ','
OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS;