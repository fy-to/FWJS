import { getLocale } from '@fy-/fws-js'
import { format as formatDateTimeago, register } from 'timeago.js'
import de from 'timeago.js/esm/lang/de'
import es from 'timeago.js/esm/lang/es'
// Import common locales individually to avoid CommonJS issues
import fr from 'timeago.js/esm/lang/fr'
import it from 'timeago.js/esm/lang/it'
import ja from 'timeago.js/esm/lang/ja'
import nl from 'timeago.js/esm/lang/nl'
import ru from 'timeago.js/esm/lang/ru'
import zh_CN from 'timeago.js/esm/lang/zh_CN'
import { useTranslation } from './translations'

// Register common locales - do this once at module initialization
const localeMap = {
  fr,
  fr_FR: fr,
  es,
  es_ES: es,
  de,
  de_DE: de,
  it,
  it_IT: it,
  nl,
  nl_NL: nl,
  ru,
  ru_RU: ru,
  ja,
  ja_JP: ja,
  zh_CN,
}

// Register all locales at once
Object.entries(localeMap).forEach(([locale, func]) => register(locale, func))

// Cache common constants and patterns
const k = 1024
const byteSizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

// Precompute log(k) for formatBytes
const logK = Math.log(k)

// Define date format options once
const dateFormatOptions = {
  date: Object.freeze({
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }),
  datetime: Object.freeze({
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  }),
}

// Color cache for contrast calculations to avoid repeated calculations
const colorContrastCache = new Map<string, string>()

// Locale transform cache to avoid repeated replacements
const localeTransformCache = new Map<string, string>()

// Default colors for contrast errors
const DEFAULT_DARK_COLOR = '#000000'
const DEFAULT_LIGHT_COLOR = '#FFFFFF'

function cropText(str: string, ml = 100, end = '...') {
  if (!str) {
    return str
  }
  if (str.length > ml) {
    return `${str.slice(0, ml)}${end}`
  }

  return str
}

function getContrastingTextColor(backgroundColor: string) {
  // Return from cache if available
  const cached = colorContrastCache.get(backgroundColor)
  if (cached) {
    return cached
  }

  // Input validation
  if (!backgroundColor || backgroundColor.length !== 7 || backgroundColor[0] !== '#') {
    return DEFAULT_DARK_COLOR
  }

  try {
    // Parse hex color components more efficiently
    const r = Number.parseInt(backgroundColor.substring(1, 3), 16)
    const g = Number.parseInt(backgroundColor.substring(3, 5), 16)
    const b = Number.parseInt(backgroundColor.substring(5, 7), 16)

    // Calculate relative luminance (standard formula for text contrast)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    const result = luminance > 0.5 ? DEFAULT_DARK_COLOR : DEFAULT_LIGHT_COLOR

    // Cache the result
    colorContrastCache.set(backgroundColor, result)
    return result
  }
  catch {
    return DEFAULT_DARK_COLOR
  }
}

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) {
    return '0 Bytes'
  }

  const dm = decimals < 0 ? 0 : decimals
  // Use precomputed logK for better performance
  const i = Math.floor(Math.log(bytes) / logK)

  return `${Number.parseFloat((bytes / k ** i).toFixed(dm))} ${byteSizes[i]}`
}

// Helper to parse date inputs consistently
function parseDateInput(dt: Date | string | number): number {
  if (dt instanceof Date) {
    return dt.getTime()
  }

  if (typeof dt === 'string') {
    const parsed = Date.parse(dt)
    return Number.isNaN(parsed) ? Number.parseInt(dt, 10) : parsed
  }

  return dt
}

function formatDate(dt: Date | string | number) {
  const timestamp = parseDateInput(dt)
  const translate = useTranslation()

  return translate('global_datetime', {
    val: new Date(timestamp),
    formatParams: {
      val: dateFormatOptions.date,
    },
  })
}

function formatDatetime(dt: Date | string | number) {
  const timestamp = parseDateInput(dt)
  const translate = useTranslation()

  return translate('global_datetime', {
    val: new Date(timestamp),
    formatParams: {
      val: dateFormatOptions.datetime,
    },
  })
}

function formatTimeago(dt: Date | string | number) {
  const timestamp = parseDateInput(dt)
  const dateObj = new Date(timestamp)

  // Get browser locale and lookup in cache
  const fullLocale = getLocale()

  // Use cached locale transformation if available
  let localeWithUnderscore = localeTransformCache.get(fullLocale)
  if (!localeWithUnderscore) {
    localeWithUnderscore = fullLocale.replace('-', '_')
    localeTransformCache.set(fullLocale, localeWithUnderscore)
  }

  // Use the locale directly - the registration above ensures support
  return formatDateTimeago(dateObj, localeWithUnderscore)
}

export {
  cropText,
  formatBytes,
  formatDate,
  formatDatetime,
  formatTimeago,
  getContrastingTextColor,
}
