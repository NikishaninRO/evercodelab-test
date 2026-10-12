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

  public start() {
    this.taskId = setInterval(
      () => this.coinMarketCapApi.getCurrencies(),
      this.coinMarketCapApiRequestFreq
    )
  }

  public stop() {
    clearInterval(this.taskId)
  }
}
