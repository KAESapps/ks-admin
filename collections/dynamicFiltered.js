import create from 'lodash/create'
import assign from 'lodash/assign'

export default function (model, filters, filterValues) {
  var currentValue = {
    loading: true,
    loaded: false,
    value: [],
  }
  return create(model, {
    query: function (params) {
      var filter = {}
      filters.forEach(appendFilter.bind(null, filter, filterValues))
      var newValue = model.query(assign({}, filter, params))
      currentValue = merge(currentValue, newValue)
      return currentValue
    },
  })
}

function appendFilter(filter, filterValues, f, i) {
  if (filterValues[i]() === '') return
  if (!f.type || f.type === 'text') return filter[f.path] = f.operator ? {[f.operator]: filterValues[i]()} : {$regex: filterValues[i](), $options: 'i'}
  if (f.type === 'boolean') return filter[f.path] = (filterValues[i]() === '$true' ? true : {$ne: true})
  if (f.type.type  === 'select') return filter[f.path] = filterValues[i]()
  if (f.type === 'date') return filter[f.path] = {[f.operator || '$eq']: filterValues[i]()}
  if (f.type === 'json') {
    try {
      var val = JSON.parse(filterValues[i]())
      return filter[f.path] = {[f.operator]: val}
    } catch (err) {
      return filter
    }
  }
}

function merge (currentValue, newValue) {
  return {
    loading: newValue.loading,
    loaded: newValue.loaded ? newValue.loaded : currentValue.loaded,
    value: newValue.loaded ? newValue.value : currentValue.value,
  }
}
