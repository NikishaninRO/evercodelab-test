import type { Database } from 'sqlite3'
import type { PriceHistoryRaw } from '../types/index.ts'

export const getPriceHistoryRawsBySym = (
  db: Database,
  cryptocurrencyId: number,
  limit: number,
  handleCallback: (raws: PriceHistoryRaw[]) => void,
  handleError: (error: Error) => void
) => {
  db.all<PriceHistoryRaw>(
    'SELECT * FROM price_history_raws WHERE cryptocurrency_id = ? LIMIT ?',
    [cryptocurrencyId, limit],
    (error: Error | null, raws: PriceHistoryRaw[]) => {
      if (error == null) {
        handleCallback(raws)
      } else {
        handleError(error)
      }
    }
  )
}
