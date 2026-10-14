import express, {
  type Express,
  type NextFunction,
  type Request,
  type Response,
} from 'express'
import type { Database } from 'sqlite3'
import pathToSwaggerUi from 'swagger-ui-dist'
import { getPriceHistoryRawsHandler } from './routeHandlers/getPriceHisrtoryRaws.ts'
import { postAddCryptocurrencyHandler } from './routeHandlers/postAddCryptocurrency.ts'
import { postRemoveCryptocurrencyHandler } from './routeHandlers/postRemoveCryptocurrency.ts'

function authMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.path == '/') return next()

  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  if (!token) return res.sendStatus(401)
  next()
}

export const createApp = (db: Database): Express => {
  const app: Express = express()

  app.use(authMiddleware)
  app.use('/static', express.static('public'))
  app.use(express.static(pathToSwaggerUi.absolutePath()))

  app.get('/price_history_raws', (req: Request, res: Response) =>
    getPriceHistoryRawsHandler(req, res, db)
  )

  app.post('/add_cryptocurrency', (req: Request, res: Response) =>
    postAddCryptocurrencyHandler(req, res, db)
  )

  app.post('/remove_cryptocurrency', (req: Request, res: Response) =>
    postRemoveCryptocurrencyHandler(req, res, db)
  )

  return app
}
