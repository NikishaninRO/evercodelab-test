export interface ValidationError {
  field: string
  message: string
}

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; errors: ValidationError[] }

type ParseResult<T> = { ok: true; value: T } | { ok: false; message: string }

export type ParamParser<T> = (raw: unknown) => ParseResult<T>

export type InferParser<T> = T extends ParamParser<infer U> ? U : never

const passed = <T>(value: T): ParseResult<T> => ({ ok: true, value })

const failed = (message: string): ParseResult<never> => ({
  ok: false,
  message,
})

export interface StringOptions {
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  patternMessage?: string
}

export const string = (
  {
    minLength = 1,
    maxLength = 255,
    pattern,
    patternMessage = 'has an invalid format',
  }: StringOptions = {}
): ParamParser<string> => {
  return (raw) => {
    if (Array.isArray(raw)) {
      return failed('must be provided exactly once')
    }
    if (typeof raw !== 'string') {
      return failed('must be a string')
    }
    const value = raw.trim()
    if (value.length < minLength) {
      return failed(`must be at least ${minLength} character(s) long`)
    }
    if (value.length > maxLength) {
      return failed(`must be at most ${maxLength} character(s) long`)
    }
    if (pattern != null && !pattern.test(value)) {
      return failed(patternMessage)
    }
    return passed(value)
  }
}

export interface IntegerOptions {
  min?: number
  max?: number
}

export const integer = (
  { min, max }: IntegerOptions = {}
): ParamParser<number> => {
  return (raw) => {
    if (Array.isArray(raw)) {
      return failed('must be provided exactly once')
    }
    if (typeof raw !== 'string' && typeof raw !== 'number') {
      return failed('must be a number')
    }
    const text = String(raw).trim()
    if (!/^[+-]?\d+$/.test(text)) {
      return failed('must be an integer')
    }
    const value = Number(text)
    if (!Number.isSafeInteger(value)) {
      return failed('must be a safe integer')
    }
    if (min != null && value < min) {
      return failed(`must be greater than or equal to ${min}`)
    }
    if (max != null && value > max) {
      return failed(`must be less than or equal to ${max}`)
    }
    return passed(value)
  }
}

export const required = <T>(parser: ParamParser<T>): ParamParser<T> => {
  return (raw) => {
    if (raw == null || raw === '') {
      return failed('is required')
    }
    return parser(raw)
  }
}

export const optional = <T>(
  parser: ParamParser<T>,
  defaultValue: T
): ParamParser<T> => {
  return (raw) => {
    if (raw == null || raw === '') {
      return passed(defaultValue)
    }
    return parser(raw)
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

export const validateParams = <S extends Record<string, ParamParser<unknown>>>(
  source: unknown,
  schema: S
): ValidationResult<{ [K in keyof S]: InferParser<S[K]> }> => {
  const values: Record<string, unknown> = {}
  const errors: ValidationError[] = []

  for (const field of Object.keys(schema) as (keyof S & string)[]) {
    const raw = isRecord(source) ? source[field] : undefined
    const result = schema[field](raw)
    if (result.ok) {
      values[field] = result.value
    } else {
      errors.push({ field, message: `${field} ${result.message}` })
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors }
  }

  return { ok: true, value: values as { [K in keyof S]: InferParser<S[K]> } }
}