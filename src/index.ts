import { createApp } from './app.ts'
import db from './db/index.ts'
import { TaskScheduler } from './services/TaskScheduler.ts'
import { CoinMarketCapApi } from './services/CoinMarketCapApi.ts'

const app = createApp(db)

const server = app.listen(3000)

const taskScheduler = new TaskScheduler(new CoinMarketCapApi(db))
try {
  taskScheduler.start()
} catch (err) {
  console.error(err)
  taskScheduler.stop()
}

const closeCallback = () => {
  taskScheduler.stop()
  server.close(() => {
    db.close()
    process.exit(0)
  })
}
process.on('SIGINT', closeCallback)
process.on('SIGTERM', closeCallback)
