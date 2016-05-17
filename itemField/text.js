import get from 'lodash/get'
import toString from 'lodash/toString'
import React from 'react'
const el = React.createElement
import { observer } from 'mobservable-react'

export const asText = function(transformValue) {
  if (!transformValue) transformValue = toString
  return function (collections, collection, itemId, fieldArg) {
    var model = typeof collection === 'string' ? collections[collection].model : collection

    return observer(function () {
      var item = model.get(itemId)
      if (!item.loaded) return el('span', null, '...')

      return el('div', null, fieldArg.path ?
        transformValue(get(item.value, fieldArg.path)) :
        transformValue(item.value)
      )
    })
  }
}

export default asText(toString)

