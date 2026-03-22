// magicLink.ts — reads URL tokens at module-evaluation time
// This module is evaluated when first imported, before any component renders.
// Both App.tsx and Login.tsx import from here and share the same values.

const _hash = new URLSearchParams(window.location.hash.substring(1))
const _search = new URLSearchParams(window.location.search.substring(1))

export const MAGIC_ACCESS_TOKEN  = _hash.get('access_token')  || _search.get('access_token')  || null
export const MAGIC_REFRESH_TOKEN = _hash.get('refresh_token') || _search.get('refresh_token') || null
export const MAGIC_TYPE          = _hash.get('type')          || _search.get('type')          || null
export const STARTED_WITH_MAGIC_LINK = !!MAGIC_ACCESS_TOKEN

// Clear URL + cached session immediately so nothing else auto-processes the token
if (STARTED_WITH_MAGIC_LINK) {
  window.history.replaceState(null, '', window.location.pathname)
  try {
    const key = 'sb-jfnafabrlumgvpzbfbuf-auth-token'
    localStorage.removeItem(key)
    sessionStorage.removeItem(key)
  } catch {}
}
