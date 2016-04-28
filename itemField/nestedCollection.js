import React from 'react'
const el = React.createElement
import {create} from 'lodash'

import {collectionEditor as collectionEditorDefault} from '../collectionsExplorer'
import nestedCollection from '../collections/nested'


export default function (arg) {
  var fieldPath = arg.path
  return function (collections, collectionId, itemId) {
    var model = collections[collectionId].model
    var virtualCollectionId = collectionId+'/'+itemId+'/'+fieldPath // pratique pour du débug
    var virtualCollection = {
      model: nestedCollection(model, itemId, fieldPath),
    }
    if (arg.extendModel) {
      virtualCollection.model = arg.extendModel(virtualCollection.model, model, itemId)
    }
    if (typeof arg.view === 'object') Object.assign(virtualCollection, arg.view)
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
