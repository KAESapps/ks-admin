import React from 'react'
const el = React.createElement
import { observer } from 'mobservable-react'
import get from 'lodash/get'
import assign from 'lodash/assign'

export default function ({view, on}) {
  var expression = typeof on === 'string' ? patchedItem => get(patchedItem, on) : on // par défaut c'est le path d'un champ

return function (collections, collectionId, itemId, $patch, fieldArgs) {
    var model = collections[collectionId].model

    return observer(function () {
      var patchedItem = assign({}, model.get(itemId).value, $patch.toJs())
      var cmp = view(expression(patchedItem))(collections, collectionId, itemId, $patch, fieldArgs)
      return el(cmp)
    })
  }
}
