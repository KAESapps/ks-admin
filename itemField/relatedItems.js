import assign from 'lodash/assign'
import React from 'react'
const el = React.createElement
import {create} from 'lodash'

import {collectionEditor} from '../collectionsExplorer'

var subCollection = function (model, foreignKeyField, itemId) {
  return create(model, {
    query: function (params) {
      return model.query(assign({}, params, {[foreignKeyField]: itemId}))
    },
    add: function (data) {
      return model.add(Object.assign({}, data, {[foreignKeyField]: itemId}))
    },
  })
}

export default function (arg) {
  var relatedCollectionId = arg.collection
  var foreignKeyField = arg.field
  return function (collections, collectionId, itemId) {
    itemId = arg.getItemId ? arg.getItemId(itemId) : itemId // pas terrible, il faudrait une meilleure abstraction pour le cas où il ne faut pas utiliser directement l'itemId
    // comme pour récupérer la liste des trnsactions d'un hotel où il faut préfixer l'id avec 'hotels/'
    var virtualCollectionId = relatedCollectionId+'/'+foreignKeyField+'='+itemId // pratique pour du débug
    var relatedModel = collections[relatedCollectionId].model
    var virtualCollection = Object.assign({
      model: subCollection(relatedModel, foreignKeyField, itemId),
    }, arg.view)
    var augmentedCollections = create(collections, {[virtualCollectionId]: virtualCollection})
    return function () {
      return el(collectionEditor(augmentedCollections, virtualCollectionId))
    }
  }
}
