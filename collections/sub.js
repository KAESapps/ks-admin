import {create} from 'lodash'
import assign from 'lodash/assign'

export default function (model, foreignKeyField, itemId) {
  return create(model, {
    query: function (params) {
      return model.query(assign({}, params, { [foreignKeyField]: itemId }))
    },
    add: function (data) {
      return model.add(assign({}, data, { [foreignKeyField]: itemId }))
    },
  })
}
