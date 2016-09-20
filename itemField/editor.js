import { createElement as el } from 'react'
import { observer } from 'mobservable-react'
import get from 'lodash/get'

export default function(makeRenderer) {
  return function (collections, collection, itemId, fieldArg) {
    var model = typeof collection === 'string' ? collections[collection].model : collection

    const renderer = makeRenderer({
      getValue: () => {
        var item = model.get(itemId)
        if (fieldArg.path) {
          return get(item.value, fieldArg.path)
        } else {
          return item.value  
        }
      },
      setValue: (value) => {
        let patch = value
        if (fieldArg.path) {
          patch = {[fieldArg.path]: value}
        }
        return model.patch(itemId, patch)
      },
    })

    return observer(function () {
      if (!itemId) return null

      var item = model.get(itemId)
      if (item.loaded) {
        return el(renderer)
      } else {
        return el('span', null, '...')
      }
    })
  }
}
