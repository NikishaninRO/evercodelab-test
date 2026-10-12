import type { Database } from 'sqlite3'
import type { CryptoCurrency, PriceHistoryRaw } from '../types/index.ts'

export const getCryptocurrencies = (
  db: Database,
  handleCallback: (raws: CryptoCurrency[]) => void
) => {
  db.all<PriceHistoryRaw>(
    'SELECT name FROM cryptocurrencies',
    (error: Error | null, raws: CryptoCurrency[]) => {
      if (error == null) {
        handleCallback(raws)
      } else {
        throw error
      }
    }
  )
}
