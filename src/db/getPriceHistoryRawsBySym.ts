import type { Database } from 'sqlite3'
import type { PriceHistoryRaw } from '../types/index.ts'

export const getPriceHistoryRawsBySym = (
  db: Database,
  sym: string,
  limit: number,
  handleCallback: (raws: PriceHistoryRaw[]) => void
) => {
  db.all<PriceHistoryRaw>(
    'SELECT * FROM price_history_raw WHERE sym = ? LIMIT ?',
    [sym, limit],
    (err: Error | null, raws: PriceHistoryRaw[]) => {
      if (err == null) {
        handleCallback(raws)
      }
    }
  )
}
