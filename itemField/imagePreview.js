import React from 'react'
const el = React.createElement
import { observer } from 'mobservable-react'
import Image from 'react-bootstrap/lib/Image'


export default function (arg) {
  var fieldId = arg
  return function (collections, collectionId, itemId) {
    var model = collections[collectionId].model
    return observer(function () {
      var fieldValue = model.get(itemId).value[fieldId]
      if (!fieldValue) return el('div', {}, "pas d'image") // null
      return el(Image, {src: fieldValue, thumbnail: true})
    })
  }
}
