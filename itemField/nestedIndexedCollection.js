import cuid from 'cuid'
import mapKeys from 'lodash/mapKeys'
import React from 'react'
const el = React.createElement
import create from 'lodash/create'
import assign from 'lodash/assign'

import {collectionEditor as collectionEditorDefault} from '../collectionsExplorer'

var subCollection = function (model, itemId, fieldPath) {
  return create(model, {
    query: function () {
      var item = model.get(itemId)
      return {
        loading: item.loading, // puisque c'est un itemField widget, normalement l'item a déjà été chargé
        loaded: item.loaded,
        value: item.value ?
          (typeof item.value[fieldPath] === 'object') ?
            Object.keys(item.value[fieldPath]).filter(v => item.value[fieldPath][v] != null) :
            []:
          null, //TODO: il faudrait peut-être une façon plus explicite de dire que c'est l'item lui-même qui n'existe pas
      }
    },
    get: function (subItemId) {
      var item = model.get(itemId)
      return {
        loading: item.loading,
        loaded: item.loaded,
        value: item.value ?
          (typeof item.value[fieldPath] === 'object') ?
            item.value[fieldPath][subItemId]:
            null:
          null, //TODO: il faudrait peut-être une façon plus explicite de dire que c'est l'item lui-même qui n'existe pas
      }
    },
    add: function (data) {
      var subItemId = cuid.slug()
      data._id = subItemId
      var patch = mapKeys(data, (value, key) => [fieldPath, subItemId, key].join('.'))
      return model.patch(itemId, patch).then(() => subItemId)
    },
    patch: function (subItemId, patch) {
      var patch = mapKeys(patch, (value, key) => [fieldPath, subItemId, key].join('.'))
      return model.patch(itemId, patch)
    },
    remove: function (subItemId) {
      var patch = {}
      patch[[fieldPath, subItemId].join('.')] = null
      return model.patch(itemId, patch)
    },
  })
}

export default function (arg) {
  var fieldPath = arg.path
  return function (collections, collectionId, itemId) {
    var model = collections[collectionId].model
    var virtualCollectionId = collectionId+'/'+itemId+'/'+fieldPath // pratique pour du débug
    var virtualCollection = {
      model: subCollection(model, itemId, fieldPath),
    }
    if (arg.extendModel) {
      virtualCollection.model = arg.extendModel(virtualCollection.model, model, itemId)
    }
    if (typeof arg.view === 'object') assign(virtualCollection, arg.view)
    var augmentedCollections = create(collections, {[virtualCollectionId]: virtualCollection})
    if (arg.extendModels) {
      augmentedCollections = arg.extendModels(augmentedCollections, itemId)
    }
    var collectionEditor = (typeof arg.view === 'function' ? arg.view : collectionEditorDefault)(augmentedCollections, virtualCollectionId)
    return function () {
      return el(collectionEditor)
    }
  }
}
