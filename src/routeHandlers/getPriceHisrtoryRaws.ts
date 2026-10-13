import { type Request, type Response } from 'express'
import type { Database } from 'sqlite3'
import { getPriceHistoryRawsBySym } from '../db/getPriceHistoryRawsBySym.ts'
import type { PriceHistoryRaw } from '../types/index.ts'
import { validateParams } from '../utils/validateParams.ts'
import {
  cryptocurrencyIdParam,
  limitParam,
  sendValidationErrors,
} from './validation.ts'

export const getPriceHistoryRawsHandler = (
  req: Request,
  res: Response,
  db: Database
) => {
  const params = validateParams(req.query, {
    cryptocurrencyId: cryptocurrencyIdParam,
    limit: limitParam,
  })
  if (!params.ok) {
    sendValidationErrors(res, params.errors)
    return
  }

  const { cryptocurrencyId: cryptocurrencyId, limit } = params.value
  const handleCallback = (raws: PriceHistoryRaw[]) => {
    res.status(200).send(raws)
  }
  try {
    getPriceHistoryRawsBySym(db, cryptocurrencyId, limit, handleCallback)
  } catch (error) {
    res.status(400).send({ error })
  }
}
