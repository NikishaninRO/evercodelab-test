import type { Database } from 'sqlite3'
import type { CryptoCurrency } from '../types/index.ts'

export interface PriceHistoryRawPayload {
  price: number
  cryprocurrencySym: string
}

export const addPriceHistoryRaw = (
  db: Database,
  payload: PriceHistoryRawPayload
) => {
  db.run('TRANSACTION START')
  db.get<CryptoCurrency>(
    'SELECT id FROM cryptocurrencies WHERE sym = ?',
    [payload.cryprocurrencySym],
    (err: Error | null, raw: CryptoCurrency) => {
      if (err == null && raw != null) {
        db.run(
          'INSERT INTO price_history_raw (cryptocurrency_id, price, created_at) VALUES (?, ?, ?)',
          [raw.id, payload.price, Date.now()]
        )
        db.run('COMMIT')
      } else {
        db.run('ROLLBACK')
      }
    }
  )
}
