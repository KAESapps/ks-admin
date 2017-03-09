import React from 'react'
const el = React.createElement
import { observer } from 'mobservable-react'
import {get} from 'lodash'
import {labeledPart} from '../form'

export default function ({view, condition}) {
  return function (collections, collectionId, itemId, $patch) {
    var model = collections[collectionId].model
    var shouldDisplay

    if (typeof(condition) !== 'function') {
      var conditionPath = condition.path
      var conditionValue = condition.value
      shouldDisplay = function() {
        var fieldValue = $patch.has(conditionPath) ?
          $patch.get(conditionPath)
          : get(model.get(itemId).value, conditionPath)

        return fieldValue === conditionValue
      }
    } else {
      shouldDisplay = () => condition(model.get(itemId).value, collections, collectionId, itemId, $patch)
    }

    var cmp = (typeof view === 'function' ? view : labeledPart)(collections, collectionId, itemId, $patch, view)

    return observer(function () {
      if (shouldDisplay()) return el(cmp) // TODO: better condition evalutation
      return null
    })
  }
}
