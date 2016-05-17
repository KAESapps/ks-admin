import mapValues from 'lodash/mapValues'
import rest from 'rest/browser'
import mime from 'rest/interceptor/mime'
import errorCode from 'rest/interceptor/errorCode'
import pathPrefix from 'rest/interceptor/pathPrefix'

import Atom from '../reactiveCollection/Atom'
import {transaction} from 'mobservable'

const jsonRequest = rest.wrap(mime, {
    mime: 'application/json',
}).wrap(errorCode, {
    code: 400,
})

const stringifyObject = function(v) {
  if (typeof v === 'object') return JSON.stringify(v)
  return v
}

export default function (arg) {
  if (typeof arg === 'string') arg = {request: arg}
  var url = arg.request
  var request = (typeof arg.request === 'string') ? jsonRequest.wrap(pathPrefix, {prefix: arg.request}) : arg.request // on peut injecter directement un request
  var itemsCache = {}
  var queriesCache = {}
  var fetchQuery = function (key, init) {
    var params = JSON.parse(key) // je sais pas si c'est terrible
    console.log('loading query', url, params)
    var obs = queriesCache[key]
    if (!init) obs.patchValue({loading: true})
    return request({params: mapValues(params, stringifyObject)}).entity().then(function (items) {
      obs.setValue({
        loading: false,
        loaded: new Date(),
        value: items.map(item => item._id),
      })
      // met à jour le cache d'items
      // on le fait volontairement après le rendu de la mise à jour de la liste, ce qui permet aux fonctions de rendu de s'abonner aux items avant de les peupler
      transaction(()=> {
        items.forEach(item => {
          var obs = itemsCache[item._id]
          if (obs) {
            obs.setValue({
              loading: false,
              loaded: new Date(),
              value: item,
            })
          }
        })
      })
    }).catch(err => console.error("query request", url, params, err))
  }
  var fetchItem = function (itemId, init) {
    console.log('loading item', url, itemId)
    var obs = itemsCache[itemId]
    if (!init) obs.patchValue({loading: true})
    return request({
      path: itemId,
    }).entity().then(function (data) {
      obs.setValue({
        loading: false,
        loaded: new Date(),
        value: data,
      })
    }).catch(err => console.error("get request", url, itemId, err))
  }
  var refreshCache = function () {
    console.log("refreshing cache", url)
    return Promise.all([
      Promise.all(Object.keys(queriesCache).map(fetchQuery)),
      Promise.all(Object.keys(itemsCache).map(fetchItem)),
    ])
  }

  var model = {
    get: function (itemId) {
      if (! (itemId in itemsCache)) {
        var item = new Atom({loading: true, loaded: false, value: {}})
        itemsCache[itemId] = item
        item.onBecomeUnobserved(function () {
          console.log('item disposed', url, itemId)
          delete itemsCache[itemId];
        })
        // auto-load
        fetchItem(itemId, true)
      }
      return itemsCache[itemId].getValue()
    },
    query: function (params) {
      params = params || {}
      var key = JSON.stringify(params)
      if (! queriesCache[key]) {
        var item = new Atom({loading: true, loaded: false, value: []})
        queriesCache[key] = item
        item.onBecomeUnobserved(function () {
          console.log('query disposed', url, params)
          delete queriesCache[key]
        })
        // auto-load
        fetchQuery(key, true)
      }
      return queriesCache[key].getValue()
    },
    refresh: refreshCache,
  }


  var actions = {
    add: function (data) {
      return {method: 'POST', entity: data}
    },
    remove: function (itemId) {
      return {method: 'DELETE', path: itemId}
    },
    patch: function (itemId, patch) {
      return {method: 'PATCH', path: itemId, entity: patch}
    },
    addSubItem: function (itemId, fieldId, data) {
      return {method: 'POST', path: itemId+'/'+fieldId, entity: data}
    },
    patchSubItem: function (itemId, fieldId, subItemId, patch) {
      return {method: 'PATCH', path: itemId+'/'+fieldId+'/'+subItemId, entity: patch}
    },
    removeSubItem: function (itemId, fieldId, subItemId) {
      return {method: 'DELETE', path: itemId+'/'+fieldId+'/'+subItemId}
    },
    addSubSubItem: function (itemId, fieldId, subItemId, subFieldId, data) {
      return {method: 'POST', path: [itemId, fieldId, subItemId, subFieldId].join('/'), entity: data}
    },
    patchSubSubItem: function (itemId, fieldId, subItemId, subFieldId, subSubItemId, patch) {
      return {method: 'PATCH', path: [itemId, fieldId, subItemId, subFieldId, subSubItemId].join('/'), entity: patch}
    },
    removeSubSubItem: function (itemId, fieldId, subItemId, subFieldId, subSubItemId) {
      return {method: 'DELETE', path: [itemId, fieldId, subItemId, subFieldId, subSubItemId].join('/')}
    },
  }
  arg.actions && Object.assign(actions, arg.actions)

  Object.keys(actions).forEach(function(actionName) {
    model[actionName] = function () {
      var requestArgs = actions[actionName].apply(null, arguments)
      var resp = request(requestArgs).entity()
      // on retourne la réponse à la commande, mais après que le cache ait été rafraichit
      return resp.then(refreshCache).catch(err => {
        console.error(actionName, url, err)
        throw err
      }).then(function () {
        return resp
      })
    }
  })

  return model
}
