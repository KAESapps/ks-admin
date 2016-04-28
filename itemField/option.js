import get from 'lodash/get'
import find from 'lodash/find'
import {asText} from './text'

export default function(options) {
  return asText(val =>
    get(find(options, ['0', val]), '1')
  )
}

