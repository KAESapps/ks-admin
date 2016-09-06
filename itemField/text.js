import toString from 'lodash/toString'
import React from 'react'
const el = React.createElement
import { observer } from 'mobservable-react'

import readOnly from './readOnly'

export const view = function({getValue}) {
  return observer(function() {
    return el('span', null, getValue())
  })
}

export const asText = function(transformValue) {
  if (!transformValue) transformValue = toString
  return readOnly(function({ getValue }) { return view({ getValue: () => transformValue(getValue()) }) })
}

export default asText(toString)
