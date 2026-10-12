import { type Request, type Response } from 'express'
import type { Database } from 'sqlite3'
import { getPriceHistoryRawsBySym } from '../db/getPriceHistoryRawsBySym.ts'
import type { PriceHistoryRaw } from '../types/index.ts'

export const getPriceHistoryRawsHandler = (
  req: Request,
  res: Response,
  db: Database
) => {
  const cryptocurrencyId = req.query['cryptocurrency_id'] as string
  const limit = req.query['limit']
  const handleCallback = (raws: PriceHistoryRaw[]) => {
    res.status(200).send(raws)
  }
  getPriceHistoryRawsBySym(
    db,
    Number(cryptocurrencyId),
    Number(limit ?? 10),
    handleCallback
  )
}
