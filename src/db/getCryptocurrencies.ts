import type { Database } from 'sqlite3'
import type { CryptoCurrency } from '../types/index.ts'

export const getCryptocurrencies = (
  db: Database,
  handleCallback: (raws: CryptoCurrency[]) => void,
  handleError: (error: Error) => void
) => {
  db.all<CryptoCurrency>(
    'SELECT name FROM cryptocurrencies',
    (error: Error | null, raws: CryptoCurrency[]) => {
      if (error == null) {
        handleCallback(raws)
      } else {
        handleError(error)
      }
    }
  )
}
