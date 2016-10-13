export default (create, onDisposed) => {
  var cache = new Map()
  var get = key => {
    if (cache.has(key)) return cache.get(key)()
    var obs = create(key)
    // console.log('obs created', key)
    cache.set(key, obs)
    obs.$mobservable && obs.$mobservable.onceSleep && obs.$mobservable.onceSleep(() => {
      onDisposed && onDisposed(key)
      cache.delete(key)
      // console.log('obs disposed', key)
    })
    return obs()
  }
  get.cache = cache
  return get
}