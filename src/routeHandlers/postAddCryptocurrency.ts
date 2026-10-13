import { type Request, type Response } from 'express'
import type { Database } from 'sqlite3'
import { addCryptocurrency } from '../db/addCryptocurrency.ts'
import { validateParams } from '../utils/validateParams.ts'
import {
  nameParam,
  sendValidationErrors,
  symParam,
} from './validation.ts'

export const postAddCryptocurrencyHandler = (
  req: Request,
  res: Response,
  db: Database
) => {
  const params = validateParams(req.query, {
    sym: symParam,
    name: nameParam,
  })
  if (!params.ok) {
    sendValidationErrors(res, params.errors)
    return
  }

  const { sym, name } = params.value
  const handleCallback = () => {
    res.sendStatus(200)
  }
  try {
    addCryptocurrency(db, { sym, name }, handleCallback)
  } catch (error) {
    res.status(400).send({ error })
  }
}