import type { Response } from 'express'
import type { ValidationError } from '../utils/validateParams.ts'
import {
  integer,
  optional,
  required,
  string,
} from '../utils/validateParams.ts'

const DEFAULT_LIMIT = 10
const MAX_LIMIT = 1000

export const symParam = required(
  string({
    minLength: 2,
    maxLength: 10,
    pattern: /^[A-Za-z0-9]+$/,
    patternMessage: 'must contain only latin letters and digits',
  })
)

export const nameParam = required(string({ minLength: 1, maxLength: 100 }))

export const cryptocurrencyIdParam = required(integer({ min: 1 }))

export const limitParam = optional(
  integer({ min: 1, max: MAX_LIMIT }),
  DEFAULT_LIMIT
)

export const sendValidationErrors = (
  res: Response,
  errors: ValidationError[]
) => {
  res.status(400).send({ error: 'Invalid query parameters', errors })
}