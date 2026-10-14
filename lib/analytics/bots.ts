/**
 * Known crawlers, link scanners, uptime monitors and scripted clients. They load pages with empty browser storage, so each
 * visit would otherwise look like a brand-new user. The list is deliberate: it names tokens instead of matching a bare "bot",
 * which would also hit real phones (for example the Cubot brand).
 */
const AUTOMATED_UA =
  /googlebot|adsbot|mediapartners|bingbot|bingpreview|yandexbot|baiduspider|duckduckbot|slurp|applebot|petalbot|semrushbot|ahrefsbot|mj12bot|dotbot|facebookexternalhit|facebot|twitterbot|linkedinbot|slackbot|discordbot|telegrambot|whatsapp\/|headlesschrome|lighthouse|pagespeed|gtmetrix|pingdom|uptimerobot|statuscake|vercel-|python-requests|node-fetch|axios\/|curl\/|wget\/|go-http-client|postmanruntime|crawler|spider/i

export function isLikelyBot(userAgent: string | null | undefined): boolean {
  return !!userAgent && AUTOMATED_UA.test(userAgent)
}
