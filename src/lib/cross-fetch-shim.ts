const _fetch = globalThis.fetch
const _Headers = globalThis.Headers
const _Request = globalThis.Request
const _Response = globalThis.Response

export { _fetch as fetch, _Headers as Headers, _Request as Request, _Response as Response }
export default _fetch
