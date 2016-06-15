export default function(view) {
  return function(collections, collection) {
    return view({ collections, collection })
  }
}
