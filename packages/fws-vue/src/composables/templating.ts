import { getLocale } from '@fy-/fws-js'
import { format as formatDateTimeago } from 'timeago.js'
import { useTranslation } from './translations'

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
  const locale = getLocale().replace('_', '-')

  return formatDateTimeago(new Date(timestamp), locale)
}

export {
  cropText,
  formatBytes,
  formatDate,
  formatDatetime,
  formatTimeago,
  getContrastingTextColor,
}
