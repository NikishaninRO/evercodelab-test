import { jest } from '@jest/globals'
import type { Database } from 'sqlite3'

interface AxiosGetOptions {
  params: { slug: string; convert: string }
  timeout: number
  headers: Record<string, string>
}

const axiosGet =
  jest.fn<(url: string, options: AxiosGetOptions) => Promise<unknown>>()

jest.unstable_mockModule('axios', () => ({
  default: { get: axiosGet },
}))

const { CoinMarketCapApi } = await import('../src/services/CoinMarketCapApi.ts')
const { all, closeDb, createTestDb, run, seedCryptocurrency, waitFor } =
  await import('./helpers/testDb.ts')
type PriceHistoryRawRow = {
  id: number
  cryptocurrency_id: number
  price: number
}

const quotesResponse = (quotes: { symbol: string; price: number }[]) => ({
  data: {
    data: quotes.map(({ symbol, price }) => ({
      symbol,
      quote: [{ price }],
    })),
  },
})

describe('CoinMarketCapApi', () => {
  let db: Database
  let api: InstanceType<typeof CoinMarketCapApi>

  beforeEach(() => {
    db = createTestDb()
    api = new CoinMarketCapApi(db)
  })

  afterEach(async () => {
    await closeDb(db)
  })

  describe('getCurrencies', () => {
    it('positive: requests quotes and stores them as price history raws', async () => {
      const bitcoin = await seedCryptocurrency(db, 'BTC', 'Bitcoin')
      const ethereum = await seedCryptocurrency(db, 'ETH', 'Ethereum')
      axiosGet.mockResolvedValue(
        quotesResponse([
          { symbol: 'BTC', price: 82000.5 },
          { symbol: 'ETH', price: 4000.25 },
        ])
      )

      await api.getCurrencies()

      expect(axiosGet).toHaveBeenCalledTimes(1)
      const [url, options] = axiosGet.mock.calls[0]
      expect(url).toContain('/v3/cryptocurrency/quotes/latest')
      expect(options.params).toEqual({
        slug: 'bitcoin,ethereum',
        convert: 'USD',
      })
      expect(options.timeout).toBe(5000)
      expect(options.headers['X-CMC_PRO_API_KEY']).toBeDefined()

      const rows = await waitFor(async () => {
        const raws = await all<PriceHistoryRawRow>(
          db,
          'SELECT * FROM price_history_raws ORDER BY price DESC'
        )
        return raws.length === 2 ? raws : undefined
      })

      expect(rows[0]).toMatchObject({
        cryptocurrency_id: bitcoin.id,
        price: 82000.5,
      })
      expect(rows[1]).toMatchObject({
        cryptocurrency_id: ethereum.id,
        price: 4000.25,
      })
    })

    it('positive: skips the external request when there are no cryptocurrencies', async () => {
      await expect(api.getCurrencies()).resolves.toBeUndefined()

      expect(axiosGet).not.toHaveBeenCalled()
      const rows = await all<PriceHistoryRawRow>(
        db,
        'SELECT * FROM price_history_raws'
      )
      expect(rows).toHaveLength(0)
    })

    it('negative: propagates a network error and stores nothing', async () => {
      await seedCryptocurrency(db, 'BTC', 'Bitcoin')
      const networkError = Object.assign(new Error('Network Error'), {
        code: 'ECONNREFUSED',
        isAxiosError: true,
      })
      axiosGet.mockRejectedValue(networkError)

      await expect(api.getCurrencies()).rejects.toThrow('Network Error')

      expect(axiosGet).toHaveBeenCalledTimes(1)
      const rows = await all<PriceHistoryRawRow>(
        db,
        'SELECT * FROM price_history_raws'
      )
      expect(rows).toHaveLength(0)
    })

    it('negative: propagates a timeout error', async () => {
      await seedCryptocurrency(db, 'BTC', 'Bitcoin')
      axiosGet.mockRejectedValue(
        Object.assign(new Error('timeout of 5000ms exceeded'), {
          code: 'ECONNABORTED',
          isAxiosError: true,
        })
      )

      await expect(api.getCurrencies()).rejects.toThrow(
        'timeout of 5000ms exceeded'
      )
      const rows = await all<PriceHistoryRawRow>(
        db,
        'SELECT * FROM price_history_raws'
      )
      expect(rows).toHaveLength(0)
    })

    it('negative: rejects a response with an unexpected shape', async () => {
      await seedCryptocurrency(db, 'BTC', 'Bitcoin')
      axiosGet.mockResolvedValue({
        data: { data: [{ symbol: 'BTC', quote: [] }] },
      })

      await expect(api.getCurrencies()).rejects.toThrow()

      const rows = await all<PriceHistoryRawRow>(
        db,
        'SELECT * FROM price_history_raws'
      )
      expect(rows).toHaveLength(0)
    })

    it('negative: propagates a database error and skips the external request', async () => {
      await run(db, 'DROP TABLE cryptocurrencies')

      await expect(api.getCurrencies()).rejects.toThrow(/no such table/i)

      expect(axiosGet).not.toHaveBeenCalled()
    })
  })
})
