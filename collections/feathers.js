import Atom from '../reactiveCollection/Atom'
import {transaction} from 'mobservable'
import identity from 'lodash/identity'
import assign from 'lodash/assign'

function eventRegistry() {
  let cbs = []
  return {
    on: function(emitter, event, cb) {
      cbs.push({ emitter, event, cb })
      return emitter.on(event, cb)
    },
    clear: function() {
      cbs.forEach(({ emitter, event, cb }) => {
        if (emitter.off) {
          emitter.off(event, cb)
        } else if (emitter.removeListener) {
          emitter.removeListener(event, cb)
        } else {
          throw "can't find a method for cancelling listener"
        }
      })
      cbs = []
    },
  }
}

export default function (arg) {
  var itemsCache = {}
  var queriesCache = {}

  var client = arg.fth.service(arg.serviceName)
  var watcher = arg.fth.service(arg.serviceName+'/subscriptions')

  const registerEvents = eventRegistry()

  registerEvents.on(watcher, 'change', function({key, type, value}) {
    console.log('received change for', key, value)
    if (type === 'query') {
      var obs = queriesCache[key]
      if (!obs) return console.warn('received change for a key not present in cache', arg.serviceName, key)
      obs.setValue({
        loading: false,
        loaded: new Date().toISOString(),
        value: type === 'item' ? value : value.data.map(o => o.id),
      })
      // on profite d'avoir déjà les valeurs des items pour mettre à jour le cache
      // mais on ne le fait pas dans la même transaction que la query pour permettre aux fonctions de rendu de s'abonner aux items
      transaction(() => {
        value.data.forEach(item => {
          var itemObs = itemsCache[item.id]
          if (itemObs) {
            itemObs.setValue({
              loading: false,
              loaded: new Date(),
              value: item,
            })
          }
        })
      })
    } else { // type === 'item'
      var obs = itemsCache[key]
      if (!obs) return console.warn('received change for a key not present in cache', arg.serviceName, key)
      obs.setValue({
        loading: false,
        loaded: new Date().toISOString(),
        value: value,
      })
    }
  })

  var watch = function (type, key, params) {
    console.log('start watching', type, arg.serviceName, params)
    return watcher.create({id: key, type: type, params: params})
  }
  var unwatch = function (key) {
    return watcher.remove(key)
  }

  registerEvents.on(arg.fth, 'disconnect', function () {
    console.log('disconnected', arg.serviceName)
  })

  registerEvents.on(arg.fth, 'authenticated', function () {
    console.log("reconnected, resubscribing to everything", arg.serviceName)
    Object.keys(queriesCache).forEach(queryKey => {
      var params = JSON.parse(queryKey.split('::')[1])
      watch('query', queryKey, params)
    })
    Object.keys(itemsCache).forEach(itemKey => {
      var itemId =itemKey.split('::')[1]
      watch('item', itemKey, itemId)
    })
  })


  var model = {
    name: arg.serviceName,
    isReactive: true,
    get: function (itemId) {
      var key = 'item::'+itemId
      if (! (key in itemsCache)) {
        var item = new Atom({loading: true, loaded: false, value: {}})
        itemsCache[key] = item
        item.onBecomeUnobserved(function () {
          console.log('item disposed', arg.serviceName, itemId)
          unwatch(key)
          delete itemsCache[key];
        })
        watch('item', key, itemId)
      }
      return itemsCache[key].getValue()
    },
    query: function (params) {
      params = params || {}
      var key = 'query::'+JSON.stringify(params)
      if (! queriesCache[key]) {
        var item = new Atom({loading: true, loaded: false, value: []})
        queriesCache[key] = item
        item.onBecomeUnobserved(function () {
          console.log('query disposed', arg.serviceName, params)
          unwatch(key)
          delete queriesCache[key]
        })
        watch('query', key, params)
      }
      return queriesCache[key].getValue()
    },

    destroy: function() {
      // unsubscribe to all events
      registerEvents.clear()
      if (arg.fth.io.connected) {
        // unsubscribe to all current requests
        return Promise.all(
          Object.keys(queriesCache).map(unwatch).concat(
            Object.keys(itemsCache).map(unwatch)
          )
        )
      } else {
        // if connection is broken, no need to unsubscribe requests
        return Promise.resolve()
      }
    },
  }


  var actions = {
    add: {
      requestArgs: function (data) {
        return ['create', data]
      },
      transformResponse: resp => resp.id,
    },
    remove: {
      requestArgs: function (itemId) {
        return ['remove', itemId]
      },
      transformResponse: identity,
    },
    patch: {
      requestArgs: function (itemId, patch) {
        return ['patch', itemId, patch]
      },
      transformResponse: identity,
    },
  }
  if (arg.actions) assign(actions, arg.actions)

  Object.keys(actions).forEach(function(actionName) {
    model[actionName] = function () {
      const actionParams = actions[actionName]

      var requestArgs = actionParams.requestArgs.apply(null, arguments)
      var resp = client[requestArgs[0]](requestArgs[1], requestArgs[2])
      return resp.catch(err => {
        console.error(arg.serviceName, actionName, err)
        throw err
      }).then(function () {
        console.log('done', requestArgs[0], requestArgs[1], requestArgs[2])
        return resp.then(actionParams.transformResponse)
      })
    }
  })

  return model
}
