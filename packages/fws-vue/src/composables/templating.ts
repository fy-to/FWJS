import { getLocale } from '@fy-/fws-js'
import { format as formatDateTimeago } from 'timeago.js'
import { useTranslation } from './translations'

function cropText(str: string, ml = 100, end = '...') {
  if (str.length > ml) {
    return `${str.slice(0, ml)}${end}`
  }
  return str
}
function getContrastingTextColor(backgroundColor: string) {
  const r = Number.parseInt(backgroundColor.substring(1, 3), 16)
  const g = Number.parseInt(backgroundColor.substring(3, 5), 16)
  const b = Number.parseInt(backgroundColor.substring(5, 7), 16)

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  return luminance > 0.5 ? '#000000' : '#FFFFFF'
}
function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${Number.parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`
}

function formatDate(dt: Date | string | number) {
  let _dt = dt as number
  if (typeof dt === 'string') {
    _dt = Date.parse(dt)
    if (Number.isNaN(_dt)) {
      _dt = Number.parseInt(dt)
    }
  }

  const translate = useTranslation()
  return translate('global_datetime', {
    val: new Date(_dt),
    formatParams: {
      val: {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      },
    },
  })
}
function formatDatetime(dt: Date | string | number) {
  let _dt = dt as number
  if (typeof dt === 'string') {
    _dt = Date.parse(dt)
    if (Number.isNaN(_dt)) {
      _dt = Number.parseInt(dt)
    }
  }
  const translate = useTranslation()
  return translate('global_datetime', {
    val: new Date(_dt),
    formatParams: {
      val: {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
      },
    },
  })
}
function formatTimeago(dt: Date | string | number) {
  let _dt = dt as number
  if (typeof dt === 'string') {
    _dt = Date.parse(dt)
    if (Number.isNaN(_dt)) {
      _dt = Number.parseInt(dt)
    }
  }
  return formatDateTimeago(new Date(_dt), getLocale().replace('_', '-'))
}

export {
  cropText,
  formatBytes,
  formatDate,
  formatDatetime,
  formatTimeago,
  getContrastingTextColor,
}
