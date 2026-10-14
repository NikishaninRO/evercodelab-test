import { type Request, type Response } from 'express'
import type { Database } from 'sqlite3'
import { addCryptocurrency } from '../db/addCryptocurrency.ts'
import { validateParams } from '../utils/validateParams.ts'
import { nameParam, sendValidationErrors, symParam } from './validation.ts'

export const postAddCryptocurrencyHandler = async (
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
  try {
    await new Promise((resolve, reject) =>
      addCryptocurrency(db, { sym, name }, resolve, reject)
    )
    res.sendStatus(200)
  } catch (error) {
    res.status(400).send({ error })
  }
}
