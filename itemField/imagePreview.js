import React from 'react'
const el = React.createElement
import { observer } from 'mobservable-react'
import Image from 'react-bootstrap/lib/Image'

export const formPart = function ({value}) {
  if (!value) return el('div', null, "pas d'image") // null
  return el(Image, {src: value, thumbnail: true})
}

export default function (arg) {
  var fieldId = arg
  return function (collections, collectionId, itemId, fieldArg) {
    if (!fieldId) fieldId = fieldArg.path
    var model = collections[collectionId].model
    return observer(function () {
      var fieldValue = model.get(itemId).value[fieldId]
      return el(formPart, {value: fieldValue})
    })
  }
}
