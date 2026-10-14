import type { Database } from 'sqlite3'
import { createDb } from '../../src/db/createDb.ts'

export interface CryptocurrencyRow {
  id: number
  sym: string
  name: string
  updated_at: number
}

export interface PriceHistoryRawRow {
  id: number
  cryptocurrency_id: number
  price: number
  createdAt: number
}

export const createTestDb = (): Database => createDb(':memory:')

export const run = (
  db: Database,
  sql: string,
  params: unknown[] = []
): Promise<void> =>
  new Promise((resolve, reject) => {
    db.run(sql, params as any[], (error: Error | null) => {
      if (error != null) {
        reject(error)
      } else {
        resolve()
      }
    })
  })

export const all = <T>(
  db: Database,
  sql: string,
  params: unknown[] = []
): Promise<T[]> =>
  new Promise((resolve, reject) => {
    db.all<T>(sql, params as any[], (error: Error | null, rows: T[]) => {
      if (error != null) {
        reject(error)
      } else {
        resolve(rows)
      }
    })
  })

export const closeDb = (db: Database): Promise<void> =>
  new Promise((resolve, reject) => {
    db.close((error: Error | null) => {
      if (error != null) {
        reject(error)
      } else {
        resolve()
      }
    })
  })

export const seedCryptocurrency = async (
  db: Database,
  sym: string,
  name: string
): Promise<CryptocurrencyRow> => {
  await run(
    db,
    'INSERT INTO cryptocurrencies (sym, name, updated_at) VALUES (?, ?, ?)',
    [sym, name, Date.now()]
  )
  const rows = await all<CryptocurrencyRow>(
    db,
    'SELECT * FROM cryptocurrencies WHERE sym = ?',
    [sym]
  )
  return rows[0]
}

export const seedPriceHistoryRaw = (
  db: Database,
  cryptocurrencyId: number,
  price: number
): Promise<void> =>
  run(
    db,
    'INSERT INTO price_history_raws (cryptocurrency_id, price, created_at) VALUES (?, ?, ?)',
    [cryptocurrencyId, price, Date.now()]
  )

/**
 * Waits for a condition that becomes true after asynchronous sqlite callbacks.
 */
export const waitFor = async <T>(
  check: () => Promise<T | undefined>,
  timeout = 5000
): Promise<T> => {
  const deadline = Date.now() + timeout
  let result = await check()
  while (result === undefined) {
    if (Date.now() > deadline) {
      throw new Error('waitFor: condition was not met in time')
    }
    await new Promise((resolve) => setTimeout(resolve, 10))
    result = await check()
  }
  return result
}
