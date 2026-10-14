import {
  integer,
  optional,
  required,
  string,
  validateParams,
} from '../src/utils/validateParams.ts'

const symSchema = {
  sym: required(
    string({
      minLength: 2,
      maxLength: 10,
      pattern: /^[A-Za-z0-9]+$/,
      patternMessage: 'must contain only latin letters and digits',
    })
  ),
}

describe('validateParams', () => {
  describe('string', () => {
    it('positive: trims the value', () => {
      const result = string()('  hello  ')

      expect(result).toEqual({ ok: true, value: 'hello' })
    })

    it('positive: accepts a value at the length bounds', () => {
      expect(string({ minLength: 2, maxLength: 4 })('abc')).toEqual({
        ok: true,
        value: 'abc',
      })
    })

    it('negative: rejects a non-string value', () => {
      expect(string()(42)).toEqual({ ok: false, message: 'must be a string' })
      expect(string()(null)).toEqual({ ok: false, message: 'must be a string' })
      expect(string()({})).toEqual({ ok: false, message: 'must be a string' })
    })

    it('negative: rejects a duplicated value', () => {
      expect(string()(['a', 'b'])).toEqual({
        ok: false,
        message: 'must be provided exactly once',
      })
    })

    it('negative: rejects a blank and an overlong value', () => {
      expect(string({ minLength: 2 })('   ')).toEqual({
        ok: false,
        message: 'must be at least 2 character(s) long',
      })
      expect(string({ maxLength: 3 })('abcd')).toEqual({
        ok: false,
        message: 'must be at most 3 character(s) long',
      })
    })

    it('negative: rejects a value that does not match the pattern', () => {
      expect(string({ pattern: /^[0-9]+$/, patternMessage: 'is bad' })('12a')).toEqual(
        { ok: false, message: 'is bad' }
      )
    })
  })

  describe('integer', () => {
    it('positive: parses numeric strings and numbers', () => {
      expect(integer()('42')).toEqual({ ok: true, value: 42 })
      expect(integer()(0)).toEqual({ ok: true, value: 0 })
      expect(integer()(' -7 ')).toEqual({ ok: true, value: -7 })
    })

    it('negative: rejects a fractional, exponent and non-numeric value', () => {
      for (const raw of ['1.5', '1e3', 'abc', '', ' ', '12px', {}]) {
        const result = integer()(raw)
        expect(result.ok).toBe(false)
      }
    })

    it('negative: rejects a duplicated value', () => {
      expect(integer()(['1', '2'])).toEqual({
        ok: false,
        message: 'must be provided exactly once',
      })
    })

    it('negative: rejects an unsafe integer', () => {
      expect(integer()('9007199254740993')).toEqual({
        ok: false,
        message: 'must be a safe integer',
      })
    })

    it('negative: enforces min and max bounds', () => {
      expect(integer({ min: 1 })('0')).toEqual({
        ok: false,
        message: 'must be greater than or equal to 1',
      })
      expect(integer({ max: 1000 })('1001')).toEqual({
        ok: false,
        message: 'must be less than or equal to 1000',
      })
      expect(integer({ min: 1, max: 1000 })('1000')).toEqual({
        ok: true,
        value: 1000,
      })
    })
  })

  describe('required', () => {
    it('positive: delegates to the inner parser', () => {
      expect(required(integer({ min: 1 }))('5')).toEqual({ ok: true, value: 5 })
    })

    it('negative: rejects missing and blank values', () => {
      expect(required(integer())(undefined)).toEqual({
        ok: false,
        message: 'is required',
      })
      expect(required(string())('')).toEqual({
        ok: false,
        message: 'is required',
      })
    })
  })

  describe('optional', () => {
    it('positive: falls back to the default value', () => {
      expect(optional(integer(), 10)(undefined)).toEqual({ ok: true, value: 10 })
      expect(optional(integer(), 10)('')).toEqual({ ok: true, value: 10 })
    })

    it('positive: uses the parsed value when it is present', () => {
      expect(optional(integer(), 10)('3')).toEqual({ ok: true, value: 3 })
    })

    it('negative: still validates a provided value', () => {
      expect(optional(integer({ min: 1 }), 10)('0')).toEqual({
        ok: false,
        message: 'must be greater than or equal to 1',
      })
    })
  })

  describe('validateParams', () => {
    it('positive: returns typed values for a valid source', () => {
      const result = validateParams({ sym: 'BTC' }, symSchema)

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.value).toEqual({ sym: 'BTC' })
      }
    })

    it('negative: reports every invalid field at once', () => {
      const result = validateParams({ sym: 'b!' }, {
        sym: symSchema.sym,
        limit: required(integer({ min: 1 })),
      })

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.errors).toEqual([
          {
            field: 'sym',
            message: 'sym must contain only latin letters and digits',
          },
          { field: 'limit', message: 'limit is required' },
        ])
      }
    })

    it('negative: treats a non-object source as an empty one', () => {
      const result = validateParams(undefined, symSchema)

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.errors).toEqual([
          { field: 'sym', message: 'sym is required' },
        ])
      }
    })
  })
})