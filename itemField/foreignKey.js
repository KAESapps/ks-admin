import React from 'react'
const el = React.createElement
import { observer } from 'mobservable-react'
import {get} from 'lodash'

export default function (arg) {
  var relatedCollection = arg.collection
  var labelField = arg.labelField
  return function (collections, collectionId, itemId, fieldArg) {
    var fieldId = fieldArg.path
    var model = collections[collectionId].model
    var relatedModel = typeof relatedCollection === 'string' ? collections[relatedCollection].model : relatedCollection
    return observer(function () {
      var fieldValue = get(model.get(itemId).value, fieldId)
      if (!fieldValue) return el('div', {}, '-') // null
      var relatedItem = relatedModel.get(fieldValue)
      if (!relatedItem.loaded) return el('div', {}, 'loading...')
      if (!relatedItem.value) return el('div', {}, 'élément inexistant')
      return el('div', {}, get(relatedItem.value, labelField))
    })
  }
}
