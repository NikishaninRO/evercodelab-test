import { type Request, type Response } from 'express'
import type { Database } from 'sqlite3'
import { removeCryptocurrency } from '../db/removeCryptocurrency.ts'
import { validateParams } from '../utils/validateParams.ts'
import { sendValidationErrors, symParam } from './validation.ts'

export const postRemoveCryptocurrencyHandler = (
  req: Request,
  res: Response,
  db: Database
) => {
  const params = validateParams(req.query, {
    sym: symParam,
  })
  if (!params.ok) {
    sendValidationErrors(res, params.errors)
    return
  }

  const { sym } = params.value
  const handleCallback = () => {
    res.sendStatus(200)
  }
  try {
    removeCryptocurrency(db, sym, handleCallback)
  } catch (error) {
    res.status(400).send({ error })
  }
}