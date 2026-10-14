import request from 'supertest'
import type { Database } from 'sqlite3'
import { createApp } from '../src/app.ts'
import {
  all,
  closeDb,
  createTestDb,
  seedCryptocurrency,
  seedPriceHistoryRaw,
} from './helpers/testDb.ts'
import type { CryptocurrencyRow, PriceHistoryRawRow } from './helpers/testDb.ts'

const AUTH = 'Bearer test-token'

describe('routes', () => {
  let db: Database
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    db = createTestDb()
    app = createApp(db)
  })

  afterEach(async () => {
    await closeDb(db)
  })

  describe('GET /price_history_raws', () => {
    it('positive: returns price history rows for a valid cryptocurrency_id', async () => {
      const bitcoin = await seedCryptocurrency(db, 'BTC', 'Bitcoin')
      await seedPriceHistoryRaw(db, bitcoin.id, 100.5)
      await seedPriceHistoryRaw(db, bitcoin.id, 101.5)

      const response = await request(app)
        .get('/price_history_raws')
        .query({ cryptocurrency_id: bitcoin.id })
        .set('Authorization', AUTH)

      expect(response.status).toBe(200)
      expect(response.body).toHaveLength(2)
      expect(response.body[0]).toMatchObject({
        cryptocurrency_id: bitcoin.id,
        price: 100.5,
      })
    })

    it('positive: applies the limit param and falls back to the default one', async () => {
      const bitcoin = await seedCryptocurrency(db, 'BTC', 'Bitcoin')
      for (const price of [1, 2, 3]) {
        await seedPriceHistoryRaw(db, bitcoin.id, price)
      }

      const limited = await request(app)
        .get('/price_history_raws')
        .query({ cryptocurrency_id: bitcoin.id, limit: 2 })
        .set('Authorization', AUTH)
      const defaulted = await request(app)
        .get('/price_history_raws')
        .query({ cryptocurrency_id: bitcoin.id })
        .set('Authorization', AUTH)

      expect(limited.status).toBe(200)
      expect(limited.body).toHaveLength(2)
      expect(defaulted.status).toBe(200)
      expect(defaulted.body).toHaveLength(3)
    })

    it('negative: rejects a missing cryptocurrency_id', async () => {
      const response = await request(app)
        .get('/price_history_raws')
        .query({ limit: 5 })
        .set('Authorization', AUTH)

      expect(response.status).toBe(400)
      expect(response.body).toEqual({
        error: 'Invalid query parameters',
        errors: [
          {
            field: 'cryptocurrency_id',
            message: 'cryptocurrency_id is required',
          },
        ],
      })
    })

    it('negative: rejects a non-integer cryptocurrency_id and an out of range limit', async () => {
      const response = await request(app)
        .get('/price_history_raws')
        .query({ cryptocurrency_id: 'abc', limit: 100000 })
        .set('Authorization', AUTH)

      expect(response.status).toBe(400)
      expect(response.body.errors).toEqual([
        {
          field: 'cryptocurrency_id',
          message: 'cryptocurrency_id must be an integer',
        },
        { field: 'limit', message: 'limit must be less than or equal to 1000' },
      ])
    })

    it('negative: rejects duplicated query params', async () => {
      const response = await request(app)
        .get('/price_history_raws?cryptocurrency_id=1&cryptocurrency_id=2')
        .set('Authorization', AUTH)

      expect(response.status).toBe(400)
      expect(response.body.errors).toEqual([
        {
          field: 'cryptocurrency_id',
          message: 'cryptocurrency_id must be provided exactly once',
        },
      ])
    })
  })

  describe('POST /add_cryptocurrency', () => {
    it('positive: stores a cryptocurrency', async () => {
      const response = await request(app)
        .post('/add_cryptocurrency')
        .query({ sym: 'SOL', name: 'Solana' })
        .set('Authorization', AUTH)

      expect(response.status).toBe(200)

      const rows = await all<CryptocurrencyRow>(
        db,
        'SELECT * FROM cryptocurrencies WHERE sym = ?',
        ['SOL']
      )
      expect(rows).toHaveLength(1)
      expect(rows[0].name).toBe('Solana')
    })

    it('positive: is idempotent for an already stored cryptocurrency', async () => {
      await seedCryptocurrency(db, 'SOL', 'Solana')

      const response = await request(app)
        .post('/add_cryptocurrency')
        .query({ sym: 'SOL', name: 'Solana' })
        .set('Authorization', AUTH)

      expect(response.status).toBe(200)
      const rows = await all<CryptocurrencyRow>(
        db,
        'SELECT * FROM cryptocurrencies WHERE sym = ?',
        ['SOL']
      )
      expect(rows).toHaveLength(1)
    })

    it('negative: rejects a malformed sym and does not store anything', async () => {
      const response = await request(app)
        .post('/add_cryptocurrency')
        .query({ sym: 'so!l', name: 'Solana' })
        .set('Authorization', AUTH)

      expect(response.status).toBe(400)
      expect(response.body.errors).toEqual([
        {
          field: 'sym',
          message: 'sym must contain only latin letters and digits',
        },
      ])

      const rows = await all<CryptocurrencyRow>(
        db,
        'SELECT * FROM cryptocurrencies'
      )
      expect(rows).toHaveLength(0)
    })

    it('negative: rejects a missing name', async () => {
      const response = await request(app)
        .post('/add_cryptocurrency')
        .query({ sym: 'SOL' })
        .set('Authorization', AUTH)

      expect(response.status).toBe(400)
      expect(response.body.errors).toEqual([
        { field: 'name', message: 'name is required' },
      ])
    })
  })

  describe('POST /remove_cryptocurrency', () => {
    it('positive: removes a stored cryptocurrency', async () => {
      await seedCryptocurrency(db, 'ETH', 'Ethereum')

      const response = await request(app)
        .post('/remove_cryptocurrency')
        .query({ sym: 'ETH' })
        .set('Authorization', AUTH)

      expect(response.status).toBe(200)

      const rows = await all<CryptocurrencyRow>(
        db,
        'SELECT * FROM cryptocurrencies WHERE sym = ?',
        ['ETH']
      )
      expect(rows).toHaveLength(0)
    })

    it('negative: rejects a missing sym and keeps the cryptocurrency', async () => {
      await seedCryptocurrency(db, 'ETH', 'Ethereum')

      const response = await request(app)
        .post('/remove_cryptocurrency')
        .set('Authorization', AUTH)

      expect(response.status).toBe(400)
      expect(response.body.errors).toEqual([
        { field: 'sym', message: 'sym is required' },
      ])

      const rows = await all<CryptocurrencyRow>(
        db,
        'SELECT * FROM cryptocurrencies WHERE sym = ?',
        ['ETH']
      )
      expect(rows).toHaveLength(1)
    })

    it('negative: rejects an overlong sym and keeps the cryptocurrency', async () => {
      await seedCryptocurrency(db, 'ETH', 'Ethereum')

      const response = await request(app)
        .post('/remove_cryptocurrency')
        .query({ sym: 'ETHEREUM-USD' })
        .set('Authorization', AUTH)

      expect(response.status).toBe(400)
      expect(response.body.errors).toEqual([
        {
          field: 'sym',
          message: 'sym must be at most 10 character(s) long',
        },
      ])

      const rows = await all<CryptocurrencyRow>(
        db,
        'SELECT * FROM cryptocurrencies WHERE sym = ?',
        ['ETH']
      )
      expect(rows).toHaveLength(1)
    })
  })

  describe('authorization', () => {
    it.each([
      ['GET', '/price_history_raws?cryptocurrency_id=1'],
      ['POST', '/add_cryptocurrency?sym=BTC&name=Bitcoin'],
      ['POST', '/remove_cryptocurrency?sym=BTC'],
    ])(
      'negative: %s %s requires an authorization token',
      async (method: string, path: string) => {
        const response = await (request(app) as any)[method.toLowerCase()](path)

        expect(response.status).toBe(401)
      }
    )
  })

  describe('price history data', () => {
    it('positive: returns an empty list for a cryptocurrency without history', async () => {
      const ethereum = await seedCryptocurrency(db, 'ETH', 'Ethereum')

      const response = await request(app)
        .get('/price_history_raws')
        .query({ cryptocurrency_id: ethereum.id })
        .set('Authorization', AUTH)

      expect(response.status).toBe(200)
      expect(response.body).toEqual([])
      const rows = await all<PriceHistoryRawRow>(
        db,
        'SELECT * FROM price_history_raws'
      )
      expect(rows).toHaveLength(0)
    })
  })
})
