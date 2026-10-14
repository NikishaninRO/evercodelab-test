import sqlite3, { type Database } from 'sqlite3'

export const createDb = (filename: string): Database => {
  const db = new sqlite3.Database(filename)
  db.serialize(() => {
    db.run(
      'CREATE TABLE IF NOT EXISTS cryptocurrencies (id INTEGER PRIMARY KEY AUTOINCREMENT, sym TEXT NOT NULL, name TEXT NOT NULL, updated_at DATETIME NOT NULL)'
    )
    db.run(
      'CREATE TABLE IF NOT EXISTS price_history_raws (id INTEGER PRIMARY KEY AUTOINCREMENT, cryptocurrency_id INTEGER NOT NULL, price REAL NOT NULL, created_at DATETIME NOT NULL, FOREIGN KEY (cryptocurrency_id) REFERENCES cryptocurrencies (id))'
    )
  })
  return db
}
