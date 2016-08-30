export default function(view) {
  return function({ collections, collection, itemId }) {
    return view(collections, collection, itemId)
  }
}
