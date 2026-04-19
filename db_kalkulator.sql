CREATE DATABASE IF NOT EXISTS db_kalkulator;
USE db_kalkulator;

CREATE TABLE IF NOT EXISTS riwayat_kalkulator (
    id INT AUTO_INCREMENT PRIMARY KEY,
    angka_1 DOUBLE NOT NULL,
    operator ENUM('+', '-', '*', '/') NOT NULL,
    angka_2 DOUBLE NOT NULL,
    hasil DOUBLE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
