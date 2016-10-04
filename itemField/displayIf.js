import React from 'react'
const el = React.createElement
import { observer } from 'mobservable-react'
import {get} from 'lodash'
import {fieldViewDefault} from '../collectionsExplorer'

export default function ({view, condition}) {
  if (typeof(condition) !== 'function') {
    var conditionPath = condition.path
    var conditionValue = condition.value
    condition = function(itemValue) {
      var fieldValue = get(itemValue, conditionPath)
      return fieldValue === conditionValue
    }
  }

  return function (collections, collection, itemId) {
    var model = typeof collection === 'string' ? collections[collection].model : collection
    var cmp = (typeof view === 'function' ? view : fieldViewDefault(view))(collections, collection, itemId)

    return observer(function () {
      if (!condition(model.get(itemId).value)) return null // TODO: better condition evalutation
      return el(cmp)
    })
  }
}
