export interface CryptoCurrency {
  id?: number
  sym?: string
  name?: string
  updatedAt?: number
}

export interface PriceHistoryRaw {
  id?: number
  cryptoCurrencyId?: number
  price?: number
  updatedAt?: number
}
