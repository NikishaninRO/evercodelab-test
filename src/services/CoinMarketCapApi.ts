import axios from 'axios'
import { env } from 'node:process'
import type { Database } from 'sqlite3'
import type { CryptoCurrency } from '../types/index.ts'
import { getCryptocurrencies } from '../db/getCryptocurrencies.ts'
import { addPriceHistoryRaw } from '../db/addPriceHistoryRaw.ts'
import { convertToSlug } from '../utils/convertToSlug.ts'

interface QuotesResponse {
  data: {
    symbol: string
    quote: Quote[]
  }[]
}

interface Quote {
  price: number
}

export class CoinMarketCapApi {
  private key: string
  private url: string
  private db: Database
  private readonly headers

  constructor(db: Database) {
    this.key = env.COIN_MARKET_CAP_API_KEY ?? ''
    this.url = env.COIN_MARKET_CAP_API_URL ?? ''
    this.db = db
    this.headers = {
      Accepts: 'application/json',
      'X-CMC_PRO_API_KEY': this.key,
    }
  }

  public async getCurrencies() {
    const handleCallback = async (raws: CryptoCurrency[]) => {
      if (raws.length === 0) {
        return
      }
      const params = {
        slug: raws.map((raw) => convertToSlug(raw.name ?? '')).join(','),
        convert: 'USD',
      }
      try {
        const response = await axios.get<QuotesResponse>(
          `${this.url}/v3/cryptocurrency/quotes/latest`,
          { headers: this.headers, params, timeout: 5000 }
        )
        for (const currency of response.data.data) {
          addPriceHistoryRaw(this.db, {
            cryprocurrencySym: currency.symbol,
            price: currency.quote[0].price,
          })
        }
      } catch (err) {
        throw err
      }
    }

    getCryptocurrencies(this.db, handleCallback)
  }
}
