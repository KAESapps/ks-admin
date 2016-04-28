import moment from 'moment'
import {asText} from './text'

const toLocaleDate = function (format) {
  return function(isoDateString) {
    if (isoDateString == null) return ''
    return new Date(isoDateString).toLocaleDateString('fr', format)
  }
}
const toShortDate = toLocaleDate({month: 'short', day: '2-digit', year: 'numeric'})

export const shortDate = asText(toShortDate)

export default function(format) {
  if (typeof format === 'string') return asText(isoDateString => moment(isoDateString).format(format))
  return asText(toLocaleDate(format))
}

