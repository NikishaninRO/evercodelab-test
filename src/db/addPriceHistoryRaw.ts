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
  db.get<CryptoCurrency>(
    'SELECT id FROM cryptocurrencies WHERE sym = ?',
    [payload.cryprocurrencySym],
    (error: Error | null, raw: CryptoCurrency) => {
      if (error == null && raw != null) {
        db.run(
          'INSERT INTO price_history_raws (cryptocurrency_id, price, created_at) VALUES (?, ?, ?)',
          [raw.id, payload.price, Date.now()]
        )
      } else {
        throw error
      }
    }
  )
}
