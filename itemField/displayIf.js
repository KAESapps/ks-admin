import React from 'react'
const el = React.createElement
import { observer } from 'mobservable-react'
import {get} from 'lodash'
import {fieldViewDefault} from '../collectionsExplorer'

export default function ({view, condition}) {
  var conditionPath = condition.path

  return function (collections, collectionId, itemId) {
    var model = collections[collectionId].model
    var cmp = (typeof view === 'function' ? view : fieldViewDefault)(collections, collectionId, itemId, view)

    return observer(function () {
      var fieldValue = get(model.get(itemId).value, conditionPath)
      if (fieldValue !== condition.value) return null // TODO: better condition evalutation
      return el(cmp)
    })
  }
}
