import type { Database } from 'sqlite3'

export interface CryptocurrencyPayload {
  sym: string
  name: string
}

export const addCryptocurrency = (
  db: Database,
  payload: CryptocurrencyPayload
) => {
  db.run(
    'INSERT INTO cryptocurrencies (sym, name, updated_at) VALUES (?, ?, ?)',
    [payload.sym, payload.name, Date.now()]
  )
}
