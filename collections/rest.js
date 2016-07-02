import mapValues from 'lodash/mapValues'
import identity from 'lodash/identity'
import assign from 'lodash/assign'
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
    add: {
      requestArgs: function (data) {
        return {method: 'POST', entity: data}
      },
      transformResponse: resp => resp._id,
    },
    remove: {
      requestArgs: function (itemId) {
        return {method: 'DELETE', path: itemId}
      },
      transformResponse: identity,
    },
    patch: {
      requestArgs: function (itemId, patch) {
        return {method: 'PATCH', path: itemId, entity: patch}
      },
      transformResponse: identity,
    },
    addSubItem: {
      requestArgs: function (itemId, fieldId, data) {
        return {method: 'POST', path: itemId+'/'+fieldId, entity: data}
      },
      transformResponse: resp => resp._id,
    },
    patchSubItem: {
      requestArgs: function (itemId, fieldId, subItemId, patch) {
        return {method: 'PATCH', path: itemId+'/'+fieldId+'/'+subItemId, entity: patch}
      },
      transformResponse: identity,
    },
    removeSubItem: {
      requestArgs: function (itemId, fieldId, subItemId) {
        return {method: 'DELETE', path: itemId+'/'+fieldId+'/'+subItemId}
      },
      transformResponse: identity,
    },
    addSubSubItem: {
      requestArgs: function (itemId, fieldId, subItemId, subFieldId, data) {
        return {method: 'POST', path: [itemId, fieldId, subItemId, subFieldId].join('/'), entity: data}
      },
      transformResponse: resp => resp._id,
    },
    patchSubSubItem: {
      requestArgs: function (itemId, fieldId, subItemId, subFieldId, subSubItemId, patch) {
        return {method: 'PATCH', path: [itemId, fieldId, subItemId, subFieldId, subSubItemId].join('/'), entity: patch}
      },
      transformResponse: identity,
    },
    removeSubSubItem: {
      requestArgs: function (itemId, fieldId, subItemId, subFieldId, subSubItemId) {
        return {method: 'DELETE', path: [itemId, fieldId, subItemId, subFieldId, subSubItemId].join('/')}
      },
      transformResponse: identity,
    },
  }
  arg.actions && assign(actions, arg.actions)

  Object.keys(actions).forEach(function(actionName) {
    model[actionName] = function () {
      const actionParams = actions[actionName]

      if (typeof actionParams === 'function') {
        var requestArgs = actionParams.apply(null, arguments)
      } else {
        var requestArgs = actionParams.requestArgs.apply(null, arguments)
      }
      // on retourne la réponse à la commande immédiatement
      var resp = request(requestArgs).entity().then(actionParams.transformResponse)
      // et on en profite pour rafraichir le cache de données au cas où mais sans attendre
      resp.then(refreshCache).catch(err => {
        console.error('error refreshing cache after action', actionName, url, err)
      })
      return resp
    }
  })

  return model
}
