import React from 'react'
const el = React.createElement
import { observer } from 'mobservable-react'
import {get} from 'lodash'

import asText from './text'

export default function (arg) {
  var relatedCollection = arg.collection
  var labelField = arg.labelField || arg.path // TODO: deprecate use of 'labelField'
  return function (collections, collectionId, itemId, fieldArg) {
    var fieldId = arg.fkPath || fieldArg.path
    var model = collections[collectionId].model

    return observer(function () {
      var item = model.get(itemId)
      if (!item.loaded) return el('span', null, '...')
      var fieldValue = get(model.get(itemId).value, fieldId)
      var view = (typeof arg.type === 'function' ? arg.type : asText)(collections, relatedCollection, fieldValue, {path: labelField})

      return el(view)
    })
  }
}
