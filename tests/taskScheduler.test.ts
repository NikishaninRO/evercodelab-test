import { jest } from '@jest/globals'
import type { CoinMarketCapApi } from '../src/services/CoinMarketCapApi.ts'

const { TaskScheduler } = await import('../src/services/TaskScheduler.ts')

type FakeApi = { getCurrencies: jest.Mock<() => Promise<void>> }

const createFakeApi = (
  getCurrencies: () => Promise<void> = async () => {}
): FakeApi => ({ getCurrencies: jest.fn(getCurrencies) })

const asCoinMarketCapApi = (api: FakeApi) =>
  api as unknown as CoinMarketCapApi

describe('TaskScheduler', () => {
  const originalFreq = process.env.COIN_MARKET_CAP_API_REQUEST_FREQ

  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
    if (originalFreq === undefined) {
      delete process.env.COIN_MARKET_CAP_API_REQUEST_FREQ
    } else {
      process.env.COIN_MARKET_CAP_API_REQUEST_FREQ = originalFreq
    }
  })

  it('positive: polls the api on the configured interval', async () => {
    process.env.COIN_MARKET_CAP_API_REQUEST_FREQ = '1000'
    const api = createFakeApi()
    const scheduler = new TaskScheduler(asCoinMarketCapApi(api))

    scheduler.start()
    expect(api.getCurrencies).not.toHaveBeenCalled()

    await jest.advanceTimersByTimeAsync(3000)

    expect(api.getCurrencies).toHaveBeenCalledTimes(3)
    scheduler.stop()
  })

  it('positive: falls back to a 5s interval when the env var is absent', async () => {
    delete process.env.COIN_MARKET_CAP_API_REQUEST_FREQ
    const api = createFakeApi()
    const scheduler = new TaskScheduler(asCoinMarketCapApi(api))

    scheduler.start()
    await jest.advanceTimersByTimeAsync(4000)
    expect(api.getCurrencies).not.toHaveBeenCalled()

    await jest.advanceTimersByTimeAsync(1000)
    expect(api.getCurrencies).toHaveBeenCalledTimes(1)
    scheduler.stop()
  })

  it('positive: stops polling after stop()', async () => {
    process.env.COIN_MARKET_CAP_API_REQUEST_FREQ = '1000'
    const api = createFakeApi()
    const scheduler = new TaskScheduler(asCoinMarketCapApi(api))

    scheduler.start()
    await jest.advanceTimersByTimeAsync(2000)
    expect(api.getCurrencies).toHaveBeenCalledTimes(2)

    scheduler.stop()
    await jest.advanceTimersByTimeAsync(10000)

    expect(api.getCurrencies).toHaveBeenCalledTimes(2)
  })

  it('positive: stop() before start() does not throw', () => {
    const api = createFakeApi()

    expect(() => new TaskScheduler(asCoinMarketCapApi(api)).stop()).not.toThrow()
  })

  it('negative: logs a failed background task and keeps polling', async () => {
    process.env.COIN_MARKET_CAP_API_REQUEST_FREQ = '1000'
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {})
    const failure = new Error('timeout of 5000ms exceeded')
    let call = 0
    const api = createFakeApi(async () => {
      call += 1
      throw call === 1 ? failure : undefined
    })
    const scheduler = new TaskScheduler(asCoinMarketCapApi(api))

    scheduler.start()
    await jest.advanceTimersByTimeAsync(2000)

    expect(api.getCurrencies).toHaveBeenCalledTimes(2)
    expect(consoleError).toHaveBeenCalledWith(
      'TaskScheduler: background task has failed',
      failure
    )
    scheduler.stop()
  })

  it('negative: an unexpected throw does not leave an unhandled rejection', async () => {
    process.env.COIN_MARKET_CAP_API_REQUEST_FREQ = '1000'
    jest.spyOn(console, 'error').mockImplementation(() => {})
    const unhandled = jest.fn()
    process.on('unhandledRejection', unhandled)
    const api = createFakeApi(() => {
      throw new Error('boom')
    })
    const scheduler = new TaskScheduler(asCoinMarketCapApi(api))

    scheduler.start()
    await jest.advanceTimersByTimeAsync(1000)
    scheduler.stop()
    await Promise.resolve()
    await Promise.resolve()
    process.off('unhandledRejection', unhandled)

    expect(unhandled).not.toHaveBeenCalled()
  })
})