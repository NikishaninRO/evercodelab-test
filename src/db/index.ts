import sqlite3 from 'sqlite3'

const db = new sqlite3.Database('./db.sqlite')
db.run(
  'CREATE TABLE IF NOT EXISTS cryptocurrencies (id INTEGER PRIMARY KEY AUTOINCREMENT, sym TEXT NOT NULL, name TEXT NOT NULL, updated_at DATETIME NOT NULL)'
)
db.run(
  'CREATE TABLE IF NOT EXISTS price_history_raws (id INTEGER PRIMARY KEY AUTOINCREMENT, cryptocurrency_id INTEGER NOT NULL, price REAL NOT NULL, created_at DATETIME NOT NULL, FOREIGN KEY (cryptocurrency_id) REFERENCES cryptocurrencies (id))'
)

export default db
