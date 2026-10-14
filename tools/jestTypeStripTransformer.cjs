/**
 * Jest transformer that strips TypeScript types with the Node.js built-in
 * type stripping API, so tests run without an extra build step.
 */
const { stripTypeScriptTypes } = require('node:module')

module.exports = {
  process(sourceText) {
    return {
      code: stripTypeScriptTypes(sourceText, {
        mode: 'strip',
        sourceMap: false,
      }),
    }
  },
}