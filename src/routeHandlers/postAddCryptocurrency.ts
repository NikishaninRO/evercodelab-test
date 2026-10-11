import { type Request, type Response } from 'express'
import type { Database } from 'sqlite3'
import { addCryptocurrency } from '../db/addCryptocurrency.ts'

export const postAddCryptocurrencyHandler = (
  req: Request,
  res: Response,
  db: Database
) => {
  const sym = req.params['sym'] as string
  const name = req.params['name'] as string
  const handleCallback = () => {
    res.status(200)
  }
  addCryptocurrency(db, { sym, name }, handleCallback)
}
