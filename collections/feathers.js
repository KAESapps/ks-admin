import Atom from '../reactiveCollection/Atom'
import {transaction} from 'mobservable'
import identity from 'lodash/identity'
import assign from 'lodash/assign'
import createEventRegistry from '../utils/eventRegistry'

function hashGet(id) {
  return 'item::' + id
}
function hashQuery(params) {
  return 'query::'+JSON.stringify(params)
}

export default function (arg) {
  var itemsCache = {}
  var queriesCache = {}
  var unwatchTimeouts = {}

  var client = arg.fth.service(arg.serviceName)
  var watcher = arg.fth.service(arg.serviceName+'/subscriptions')

  const eventRegistry = createEventRegistry()

  eventRegistry.on(watcher, 'change', function({key, type, value}) {
    // console.log('received change for', key, value)
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
          var itemObs = itemsCache[hashGet(item.id)]
          if (itemObs && itemObs.getValue().loading) {
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
    // console.log('start watching', type, arg.serviceName, params)
    return watcher.create({id: key, type: type, params: params})
  }
  var unwatch = function (key) {
    return watcher.remove(key)
  }

  var scheduleForUnwatch = (type, key) => () => {
    const obsCache = type === 'item' ? itemsCache : queriesCache
    // console.log(key, "scheduled for unwatch")
    unwatchTimeouts[key] = setTimeout(() => {
      unwatch(key)
      delete obsCache[key]
      delete unwatchTimeouts[key]
      // console.log('obs disposed', arg.serviceName, key)
    }, 1000 * 60 * 3)
  }

  var cancelScheduleForUnwatchIfNecessary = (type, key) => {
    if (unwatchTimeouts[key]) {
      // console.log('unwatch schedule canceled', key)
      clearTimeout(unwatchTimeouts[key])
      delete unwatchTimeouts[key]
      const obsCache = type === 'item' ? itemsCache : queriesCache
      const obs = obsCache[key]
      obs.onBecomeUnobserved(scheduleForUnwatch(type, key))
    }
  }

  eventRegistry.on(arg.fth, 'disconnect', function () {
    console.log('disconnected', arg.serviceName)
  })

  eventRegistry.on(arg.fth, 'authenticated', function () {
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
      var key = hashGet(itemId)
      cancelScheduleForUnwatchIfNecessary('item', key)
      if (! (key in itemsCache)) {
        var item = new Atom({loading: true, loaded: false, value: {}})
        itemsCache[key] = item
        item.onBecomeUnobserved(scheduleForUnwatch('item', key))
        watch('item', key, itemId)
      }
      return itemsCache[key].getValue()
    },
    query: function (params) {
      params = params || {}
      var key = hashQuery(params)
      cancelScheduleForUnwatchIfNecessary('query', key)
      if (! queriesCache[key]) {
        var item = new Atom({loading: true, loaded: false, value: []})
        queriesCache[key] = item
        item.onBecomeUnobserved(scheduleForUnwatch('query', key))
        watch('query', key, params)
      }
      return queriesCache[key].getValue()
    },
    // expose cache for extensibility
    getItemCache: function(itemId) {
      var key = hashGet(itemId)
      return itemsCache[key]
    },
    getQueryCache: function(params = {}) {
      var key = hashQuery(params)
      return queriesCache[key]
    },

    destroy: function() {
      // unsubscribe to all events
      eventRegistry.clear()
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
