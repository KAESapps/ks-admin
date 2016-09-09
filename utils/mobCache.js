export default create => {
  var cache = new Map()
  var get = key => {
    if (cache.has(key)) return cache.get(key)()
    var obs = create(key)
    // console.log('obs created', key)
    cache.set(key, obs)
    // TODO: supprimer les entrées du cache quand elles ne sont plus utilisées
    // obs.$mobservable.onceSleep(() => {
    //   cache.delete(key)
    //   // console.log('obs disposed', key)
    // })
    return obs()
  }
  get.cache = cache
  return get
}