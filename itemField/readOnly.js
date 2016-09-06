import { createElement as el } from 'react'
import { observer } from 'mobservable-react'
import get from 'lodash/get'

export default function(renderer) {
  return function (collections, collection, itemId, fieldArg) {
    var model = typeof collection === 'string' ? collections[collection].model : collection

    return observer(function () {
      if (!itemId) return null

      var item = model.get(itemId)
      if (!item.loaded) return el('span', null, '...')

      return el(renderer({ getValue: () => fieldArg.path ? get(item.value, fieldArg.path) : item.value }))
    })
  }
}
