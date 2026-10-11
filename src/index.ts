import express, {
  type Express,
  type NextFunction,
  type Request,
  type Response,
} from 'express'
import db from './db/index.ts'

const app: Express = express()

function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  if (!token) return res.sendStatus(401)
  next()
}

app.use(authMiddleware)

const server = app.listen(3000)

const closeCallback = () => {
  server.close(() => {
    db.close()
    process.exit(0)
  })
}

process.on('SIGINT', closeCallback)
process.on('SIGTERM', closeCallback)
