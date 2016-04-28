import React from 'react'
const el = React.createElement
import { observer } from 'mobservable-react'
import {get} from 'lodash'
import {labeledPart} from '../form'

export default function ({view, condition}) {
  var conditionPath = condition.path

  return function (collections, collectionId, itemId, $patch) {
    var model = collections[collectionId].model
    var cmp = (typeof view === 'function' ? view : labeledPart)(collections, collectionId, itemId, $patch, view)

    return observer(function () {
      var fieldValue = $patch.has(conditionPath) ?
        $patch.get(conditionPath) :
        get(model.get(itemId).value, conditionPath)
      if (fieldValue === condition.value) return el(cmp) // TODO: better condition evalutation
      return null
    })
  }
}
