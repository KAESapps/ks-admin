import create from 'lodash/create'
import assign from 'lodash/assign'

export default function (model, getFilter) {
  var currentValue = {
    loading: true,
    loaded: false,
    value: [],
  }
  return create(model, {
    query: function (params) {
      var newValue = model.query(assign({}, getFilter(), params))
      currentValue = merge(currentValue, newValue)
      return currentValue
    },
  })
}


function merge (currentValue, newValue) {
  return {
    loading: newValue.loading,
    loaded: newValue.loaded ? newValue.loaded : currentValue.loaded,
    value: newValue.loaded ? newValue.value : currentValue.value,
  }
}
