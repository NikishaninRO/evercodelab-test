import { type Request, type Response } from 'express'
import type { Database } from 'sqlite3'
import { removeCryptocurrency } from '../db/removeCryptocurrency.ts'

export const postRemoveCryptocurrencyHandler = (
  req: Request,
  res: Response,
  db: Database
) => {
  const sym = req.query['sym'] as string
  const handleCallback = () => {
    res.status(200).send()
  }
  removeCryptocurrency(db, sym, handleCallback)
}
