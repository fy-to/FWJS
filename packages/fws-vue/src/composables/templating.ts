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

// Register common locales
register('fr', fr)
register('fr_FR', fr)
register('es', es)
register('es_ES', es)
register('de', de)
register('de_DE', de)
register('it', it)
register('it_IT', it)
register('nl', nl)
register('nl_NL', nl)
register('ru', ru)
register('ru_RU', ru)
register('ja', ja)
register('ja_JP', ja)
register('zh_CN', zh_CN)

// Cache common constants and patterns
const k = 1024
const byteSizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
const dateFormatOptions = {
  date: {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  },
  datetime: {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  },
}

// Color cache for contrast calculations to avoid repeated calculations
const colorContrastCache = new Map<string, string>()

function cropText(str: string, ml = 100, end = '...') {
  if (!str) return str
  if (str.length > ml) {
    return `${str.slice(0, ml)}${end}`
  }
  return str
}

function getContrastingTextColor(backgroundColor: string) {
  // Return from cache if available
  if (colorContrastCache.has(backgroundColor)) {
    return colorContrastCache.get(backgroundColor)!
  }

  // Input validation
  if (!backgroundColor || backgroundColor.length !== 7 || backgroundColor[0] !== '#') {
    return '#000000'
  }

  try {
    const r = Number.parseInt(backgroundColor.substring(1, 3), 16)
    const g = Number.parseInt(backgroundColor.substring(3, 5), 16)
    const b = Number.parseInt(backgroundColor.substring(5, 7), 16)

    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    const result = luminance > 0.5 ? '#000000' : '#FFFFFF'

    // Cache the result
    colorContrastCache.set(backgroundColor, result)
    return result
  }
  catch {
    return '#000000'
  }
}

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes'

  const dm = decimals < 0 ? 0 : decimals
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${Number.parseFloat((bytes / k ** i).toFixed(dm))} ${byteSizes[i]}`
}

// Helper to parse date inputs consistently
function parseDateInput(dt: Date | string | number): number {
  if (dt instanceof Date) {
    return dt.getTime()
  }

  if (typeof dt === 'string') {
    const parsed = Date.parse(dt)
    return Number.isNaN(parsed) ? Number.parseInt(dt) : parsed
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

  // Get browser locale and format it for timeago.js
  const fullLocale = getLocale()

  // Convert locale format (e.g., fr-FR to fr_FR)
  const localeWithUnderscore = fullLocale.replace('-', '_')

  // Use the locale directly - the registration above ensures support
  // timeago.js will fall back to en_US if no matching locale is found
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
