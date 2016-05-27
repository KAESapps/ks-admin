import React from 'react'
const el = React.createElement
import create from 'lodash/create'

import {collectionEditor} from '../collectionsExplorer'

import subCollection from '../collections/sub'

export default function (arg) {
  var relatedCollectionId = typeof arg.collection === 'string' ? arg.collection : arg.collection.name
  var foreignKeyField = arg.field
  return function (collections, collectionId, itemId) {
    itemId = arg.getItemId ? arg.getItemId(itemId) : itemId // pas terrible, il faudrait une meilleure abstraction pour le cas où il ne faut pas utiliser directement l'itemId
    // comme pour récupérer la liste des trnsactions d'un hotel où il faut préfixer l'id avec 'hotels/'
    var virtualCollectionId = relatedCollectionId+'/'+foreignKeyField+'='+itemId // pratique pour du débug
    var relatedModel = typeof arg.collection === 'string' ? collections[relatedCollectionId].model : arg.collection
    var virtualCollection = Object.assign({
      model: subCollection(relatedModel, foreignKeyField, itemId),
    }, arg.view)
    var augmentedCollections = create(collections, {[virtualCollectionId]: virtualCollection})

    const view = (typeof arg.view === 'function') ? arg.view : collectionEditor

    return function () {
      return el(view(augmentedCollections, virtualCollectionId))
    }
  }
}
