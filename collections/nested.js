import create from 'lodash/create'
import get from 'lodash/get'


export default function (model, itemId, fieldPath) {
  return create(model, {
    query: function (params) {
      var item = model.get(itemId)
      var fieldValue = get(item.value, fieldPath) || []
      var $skip = params && params.$skip || 0
      var $limit = params && params.$limit || 10
      // TODO:  $sort
      return {
        loading: item.loading, // puisque c'est un itemField widget, normalement l'item a déjà été chargé
        loaded: item.loaded,
        value: fieldValue.map(subItem => subItem._id).slice($skip, $skip+$limit),
      }
    },
    get: function (subItemId) {
      var item = model.get(itemId)
      return {
        loading: item.loading,
        loaded: item.loaded,
        value: item.value ?
          Array.isArray(item.value[fieldPath]) ?
            item.value[fieldPath].filter(subItem => subItem._id === subItemId)[0]:
            null:
          null, //TODO: il faudrait peut-être une façon plus explicite de dire que c'est l'item lui-même qui n'existe pas
      }
    },
    add: function (data) {
      return model.addSubItem(itemId, fieldPath, data)
    },
    patch: function (subItemId, patch) {
      return model.patchSubItem(itemId, fieldPath, subItemId, patch)
    },
    remove: function (subItemId) {
      return model.removeSubItem(itemId, fieldPath, subItemId)
    },
    addSubItem: function (subItemId, subFieldPath, data) {
      return model.addSubSubItem(itemId, fieldPath, subItemId, subFieldPath, data)
    },
    patchSubItem: function (subItemId, subFieldPath, subSubItemId, patch) {
      return model.patchSubSubItem(itemId, fieldPath, subItemId, subFieldPath, subSubItemId, patch)
    },
    removeSubItem: function (subItemId, subFieldPath, subSubItemId) {
      return model.removeSubSubItem(itemId, fieldPath, subItemId, subFieldPath, subSubItemId)
    },
  })
}