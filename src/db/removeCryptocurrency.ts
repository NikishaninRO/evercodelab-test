import type { Database } from 'sqlite3'

export const removeCryptocurrency = (
  db: Database,
  sym: string,
  handleCallback: () => void
) => {
  db.run(
    'DELETE FROM cryptocurrencies WHERE sym = ?',
    [sym],
    (error: Error | null) => {
      if (error == null) {
        handleCallback()
      } else {
        throw error
      }
    }
  )
}
