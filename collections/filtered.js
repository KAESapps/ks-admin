import create from 'lodash/create'
import assign from 'lodash/assign'

export default function (model, filter) {
  return create(model, {
    query: function (params) {
      return model.query(assign({}, filter, params))
    },
  })
}
