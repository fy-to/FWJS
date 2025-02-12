import { getLocale } from '@karpeleslab/klbfw'
import { format as formatDateTimeago } from 'timeago.js'
import { useTranslation } from '../composables/translations'

function cropText(str: string, ml = 100, end = '...') {
  if (str.length > ml) {
    return `${str.slice(0, ml)}${end}`
  }
  return str
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
function formatRecurringPaymentCycle(cycle?: string): string {
  const translate = useTranslation()
  if (!cycle) {
    return translate('payment_cycles_one_time')
  }
  const unit = cycle.slice(-1)
  const quantity = Number.parseInt(cycle.replace(unit, ''))
  switch (unit) {
    case 'h':
      return translate('payment_cycles_hour', { count: quantity })
      break
    case 'w':
      return translate('payment_cycles_week', { count: quantity })
      break
    case 'd':
      return translate('payment_cycles_day', { count: quantity })
      break
    case 'm':
      return translate('payment_cycles_month', { count: quantity })
      break
    case 'y':
      return translate('payment_cycles_year', { count: quantity })
      break
  }

  return ''
}
export {
  cropText,
  formatBytes,
  formatDate,
  formatDatetime,
  formatRecurringPaymentCycle,
  formatTimeago,
}
