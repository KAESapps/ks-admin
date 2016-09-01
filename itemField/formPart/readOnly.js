export default (view) => function(collections, collectionId, itemId, $patch, options) {
  var path = options.path
  var model = collections[collectionId].model

  return view({ getValue: () => $patch.get(path) || model.get(itemId).value[path] })
}
