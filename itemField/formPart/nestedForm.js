// sous-formulaire permettant d'éditer un champ de type objet
import { partFactory } from '../form'
import { createElement as el } from 'react'
import get from 'lodash/get'
import create from 'lodash/create'
import assign from 'lodash/assign'

export default function(path, parts) {
  return function (collections, collectionId, itemId, $patch) {
    var model = collections[collectionId].model
    const subModel = {
      get: function() {
        var item = model.get(itemId)
        return create(item, {
          value: get(item.value, path),
        })
      },
    }

    const $subPatch = create($patch, {
      set: function(subPath, subValue) {
        var itemValue = model.get(itemId).value
        const baseValue = $patch.has(path) ? $patch.get(path) : get(itemValue, path)

        return $patch.set(path, assign({}, baseValue, { [subPath]: subValue }))
      },
      get: function(subPath) {
        return get($patch.get(path), subPath)
      },
      has: function() {
        return $patch.has(path)
      },
    })

    const subCollectionId = [collectionId + '.' + path]
    const cmps = parts.map(partFactory(create(collections, {
      [subCollectionId]: { model: subModel },
    }), subCollectionId, itemId, $subPatch))

    return function subForm() {
      return el('div', {}, cmps.map((cmp, i) => el(cmp, {key: i})))
    }
  }
}
