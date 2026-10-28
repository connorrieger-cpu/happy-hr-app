import type { Env } from '../../server/shared'
import { venuesPayload } from '../../server/venues'

// GET /api/venues?area=guelph: an area's listed venues with their happy hours, daily
// specials and food tags, plus the area, every area and the food types. Without
// ?area it's Ossington, as apps from before areas expect. For the iOS app (the web
// app bundles the same data). Supports If-None-Match, so apps can check cheaply.
export const onRequestGet: PagesFunction<Env> = async ({ request }) => {
  const found = venuesPayload(new URL(request.url).searchParams.get('area') ?? undefined)
  if (!found)
    return new Response(JSON.stringify({ error: 'Unknown area.' }), {
      status: 404,
      headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' },
    })
  const { payload, body } = await found
  const etag = `"${payload.version}"`
  const headers = {
    etag,
    'cache-control': 'public, max-age=300',
    'access-control-allow-origin': '*',
  }
  // Cloudflare weakens the ETag (W/"…") when it compresses the response, and
  // apps send back whatever they got, so compare the tags without the W/.
  const sent = (request.headers.get('if-none-match') ?? '').split(',').map((tag) => tag.trim().replace(/^W\//, ''))
  if (sent.includes(etag) || sent.includes('*')) return new Response(null, { status: 304, headers })
  return new Response(body, { headers: { ...headers, 'content-type': 'application/json; charset=utf-8' } })
}
