// groupe de champs
import { partFactory } from '../form'
import { createElement as el } from 'react'

export default function(parts) {
  return function (collections, collectionId, itemId, $patch) {
    const cmps = parts.map(partFactory(collections, collectionId, itemId, $patch))

    return function subForm() {
      return el('div', {},
        cmps.map((cmp, i) => el(cmp, {key: i}))
      )
    }
  }
}
