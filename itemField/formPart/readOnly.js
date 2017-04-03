import { observable } from 'mobservable'

export default (view) => function(collections, collectionId, itemId, $patch, options) {
  var path = options.path
  var model = collections[collectionId].model
  var getValue = observable(() => $patch.get(path) || model.get(itemId).value[path])

  return view({ getValue })
}
