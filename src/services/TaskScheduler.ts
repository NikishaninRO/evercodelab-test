import { env } from 'node:process'
import type { CoinMarketCapApi } from './CoinMarketCapApi.ts'

export class TaskScheduler {
  private coinMarketCapApi: CoinMarketCapApi
  private taskId?: NodeJS.Timeout
  private coinMarketCapApiRequestFreq: number

  constructor(coinMarketCapApi: CoinMarketCapApi) {
    this.coinMarketCapApi = coinMarketCapApi
    this.coinMarketCapApiRequestFreq = Number(
      env.COIN_MARKET_CAP_API_REQUEST_FREQ ?? 5000
    )
  }

  private runTask = async () => {
    try {
      await this.coinMarketCapApi.getCurrencies()
    } catch (error) {
      console.error('TaskScheduler: background task has failed', error)
    }
  }

  public start() {
    this.taskId = setInterval(
      this.runTask,
      this.coinMarketCapApiRequestFreq
    )
  }

  public stop() {
    clearInterval(this.taskId)
    this.taskId = undefined
  }
}