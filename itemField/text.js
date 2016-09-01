import get from 'lodash/get'
import toString from 'lodash/toString'
import React from 'react'
const el = React.createElement
import { observer } from 'mobservable-react'

export const view = function({getValue}) {
  return observer(function() {
    return el('span', null, getValue())
  })
}

export const asText = function(transformValue) {
  if (!transformValue) transformValue = toString
  return function (collections, collection, itemId, fieldArg) {
    var model = typeof collection === 'string' ? collections[collection].model : collection

    return observer(function () {
      if (!itemId) return null

      var item = model.get(itemId)
      if (!item.loaded) return el('span', null, '...')

      return el(view({ getValue: () => fieldArg.path ?
        transformValue(get(item.value, fieldArg.path)) :
        transformValue(item.value),
      }))
    })
  }
}

export default asText(toString)
