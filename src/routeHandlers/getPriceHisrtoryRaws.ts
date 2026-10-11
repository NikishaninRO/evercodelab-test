import { type Request, type Response } from 'express'
import type { Database } from 'sqlite3'
import { getPriceHistoryRawsBySym } from '../db/getPriceHistoryRawsBySym.ts'
import type { PriceHistoryRaw } from '../types/index.ts'

export const getPriceHistoryRawsHandler = (
  req: Request,
  res: Response,
  db: Database
) => {
  const sym = req.params['sym'] as string
  const limit = req.params['limit']
  const handleCallback = (raws: PriceHistoryRaw[]) => {
    res.status(200).send(raws)
  }
  getPriceHistoryRawsBySym(db, sym, Number(limit), handleCallback)
}
