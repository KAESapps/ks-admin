import {observable, asReference} from 'mobservable'
import mobCache from '../utils/mobCache'
import assign from 'lodash/assign'
import get from 'lodash/get'
import each from 'lodash/each'
import matches from 'lodash/matches'
import startsWith from 'lodash/startsWith'
import map from 'lodash/map'
import orderBy from 'lodash/orderBy'
import pickBy from 'lodash/pickBy'
import shortid from 'shortid'


const notSpecialKey = k => !startsWith(k, '$')

export default function (initialValues) {
  var values = initialValues || {}

  var keyAccessors = mobCache(key => observable(asReference(key in values ? values[key] : null)))
  var fullIndex = observable(asReference(Object.keys(values)))
  var filterAccessors = mobCache(filterAsString => {
    const filterArgs = JSON.parse(filterAsString)
    const matchesFilter = matches(filterArgs)
    var ids = []
    each(values, (value, key) => {
      if (matchesFilter(value)) ids.push(key)
    })
    return observable(asReference(ids))
  })
  var sortedAccessors = mobCache(queryArgsAsString => {
    const args = JSON.parse(queryArgsAsString)
    const iteratees = map(args.$sort, (v, k) => id => get(keyAccessors(id), k))
    const orderArg = map(args.$sort, (v) => (v > 0) ? 'asc' : 'desc')
    return observable(() => {
      var ids
      if (Object.keys(args).filter(notSpecialKey).length) {
        const filterArgs = pickBy(args, (v, k) => notSpecialKey(k))
        ids = filterAccessors(JSON.stringify(filterArgs))
      } else {
        ids = fullIndex()
      }
      const orderedIds = orderBy(ids, iteratees, orderArg)
      return orderedIds
    })
  })
  var slicedAccessors = mobCache(queryArgsAsString => {
    const args = JSON.parse(queryArgsAsString)
    const start = args.$skip || 0
    const end = args.$limit && (start + args.$limit)
    return observable(() => {
      var ids
      if (args.$sort) {
        ids = sortedAccessors(JSON.stringify(args))
      } else if (Object.keys(args).filter(notSpecialKey).length) {
        const filterArgs = pickBy(args, (v,k) => notSpecialKey(k))
        ids = filterAccessors(JSON.stringify(filterArgs))
      } else {
        ids = fullIndex()
      }
      return ids.slice(start, end)
    })
  })
  var query = function (args = {}) {
    if (args.$skip || args.$limit) return slicedAccessors(JSON.stringify(args))
    if (args.$sort) return sortedAccessors(JSON.stringify(args))
    if (Object.keys(args).length) return filterAccessors(JSON.stringify(args))
    return fullIndex()
  }
  var observer

  return {
    isReactive: true,
    get: function (key) {
      return {loaded: true, value: keyAccessors(key)}
    },
    getOnce: function (key) {
      return Promise.resolve(key in values ? values[key] : null)
    },
    query: function(args) {
      return {loaded: true, value: query(args)}
    },
    queryOnce: function (args) {
      return Promise.resolve(query(args))
    },
    observe: function (cb) {
      observer = cb
    },
    add: function (arg) {
      return Promise.resolve().then(()=> {
        const key = shortid.generate()
        const value = assign({ createdAt: new Date().toISOString() }, arg)
        // save value
        values[key] = value
        // update fullIndex
        fullIndex(Object.keys(values))
        // trigger key accessor if there is one
        const keyAccessor = keyAccessors.cache[key]
        if (keyAccessor) keyAccessor(value)
        // trigger filter accessors
        filterAccessors.cache.forEach((accessor, filterAsString) => {
          const filterArgs = JSON.parse(filterAsString)
          const matchesFilter = matches(filterArgs)
          if (matchesFilter(value)) accessor(accessor().concat(key))
        })
        observer && observer(values)
        return key
      })
    },
    patch: function (key, patch) {
      return Promise.resolve().then(()=> {
        const oldValue = values[key]
        const value = assign({}, oldValue, patch)
        // save value
        values[key] = value
        // trigger key accessor if there is one
        const keyAccessor = keyAccessors.cache.get(key)
        if (keyAccessor) keyAccessor(value)
        // trigger filter accessors if concerned
        filterAccessors.cache.forEach((accessor, filterAsString) => {
          const filterArgs = JSON.parse(filterAsString)
          const matchesFilter = matches(filterArgs)
          const valueMatches = matchesFilter(value)
          const ids = accessor()
          const indexOfKey = ids.indexOf(key)
          const hasKey = indexOfKey >= 0
          if (valueMatches) {
            // add key if not already present
            if (!hasKey) accessor(ids.concat(key))
          } else {
            // remove key if needed
            if (hasKey) accessor(ids.slice().splice(indexOfKey, 1))
          }
        })
        observer && observer(values)
        return value
      })
    },
    remove: function (key) {
      return Promise.resolve().then(()=> {
        // remove value from cache
        delete values[key]
        // update fullIndex
        fullIndex(Object.keys(values))
        // trigger key accessor if there is one
        const keyAccessor = keyAccessors.cache[key]
        if (keyAccessor) keyAccessor(null)
        // trigger filter accessors if concerned
        filterAccessors.cache.forEach((accessor) => {
          const ids = accessor().value
          const indexOfKey = ids.indexOf(key)
          const hasKey = indexOfKey >= 0
          // remove key if needed
          if (hasKey) accessor(ids.slice().splice(indexOfKey, 1))
        })
        observer && observer(values)
        return true
      })

    },
  }
}
