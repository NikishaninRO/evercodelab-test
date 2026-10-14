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

export const getPriceHistoryRawsHandler = async (
  req: Request,
  res: Response,
  db: Database
) => {
  const params = validateParams(req.query, {
    cryptocurrency_id: cryptocurrencyIdParam,
    limit: limitParam,
  })
  if (!params.ok) {
    sendValidationErrors(res, params.errors)
    return
  }

  const { cryptocurrency_id: cryptocurrencyId, limit } = params.value
  try {
    const raws = await new Promise<PriceHistoryRaw[]>((resolve, reject) =>
      getPriceHistoryRawsBySym(db, cryptocurrencyId, limit, resolve, reject)
    )
    res.status(200).send(raws)
  } catch (error) {
    res.status(400).send({ error })
  }
}
