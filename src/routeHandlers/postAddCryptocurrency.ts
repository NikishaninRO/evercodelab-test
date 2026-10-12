import { type Request, type Response } from 'express'
import type { Database } from 'sqlite3'
import { addCryptocurrency } from '../db/addCryptocurrency.ts'

export const postAddCryptocurrencyHandler = (
  req: Request,
  res: Response,
  db: Database
) => {
  const sym = req.query['sym'] as string
  const name = req.query['name'] as string
  const handleCallback = () => {
    res.status(200).send()
  }
  addCryptocurrency(db, { sym, name }, handleCallback)
}
