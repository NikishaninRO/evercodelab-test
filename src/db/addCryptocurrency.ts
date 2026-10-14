import type { Database } from 'sqlite3'
import type { CryptoCurrency } from '../types/index.ts'

export interface CryptocurrencyPayload {
  sym: string
  name: string
}

export const addCryptocurrency = (
  db: Database,
  payload: CryptocurrencyPayload,
  handleCallback: (value: unknown) => void,
  handleError: (error: Error) => void
) => {
  db.get<CryptoCurrency>(
    'SELECT id FROM cryptocurrencies WHERE sym = ?',
    [payload.sym],
    (error: Error | null, raw: CryptoCurrency) => {
      if (error != null) {
        handleError(error)
      }
      if (raw != null) {
        handleCallback(null)
      } else {
        db.run(
          'INSERT INTO cryptocurrencies (sym, name, updated_at) VALUES (?, ?, ?)',
          [payload.sym, payload.name, Date.now()],
          (error: Error | null) => {
            if (error == null) {
              handleCallback(null)
            } else {
              handleError(error)
            }
          }
        )
      }
    }
  )
}
