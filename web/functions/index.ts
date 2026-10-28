import { parseLink, previewText } from '../src/lib/share'
import { formatTime } from '../src/lib/time'
import type { Env } from '../server/shared'
import { findVenue } from '../server/venues'

// Link previews for shared spots: `/?a=ossington&v=manita` and `…&meet=1050`
// get their own title and description, so a link dropped in a chat says
// where (and when) instead of just "Happy HR".
export const onRequestGet: PagesFunction<Env> = async ({ request, next }) => {
  const response = await next()
  const { venueId, meet } = parseLink(new URL(request.url).search)
  if (!venueId || !response.headers.get('content-type')?.includes('text/html')) return response
  const venue = (await findVenue(venueId))?.venue
  if (!venue) return response

  const title = meet != null ? `Meet at ${venue.name}, ${formatTime(meet, { compact: true })}?` : `${venue.name} · Happy HR`
  const description = previewText(venue)
  const set = (content: string) => ({ element: (e: Element) => void e.setAttribute('content', content) })
  return new HTMLRewriter()
    .on('title', { element: (e) => void e.setInnerContent(title) })
    .on('meta[property="og:title"]', set(title))
    .on('meta[name="description"]', set(description))
    .on('meta[property="og:description"]', set(description))
    .on('meta[property="og:url"]', set(request.url))
    .transform(response)
}
