import memoryCollection from './memory'

// storage must conform to the following interface
// get() => Promise<value>
// set(value) => Promise
// name (optional) string for debug

export default storage =>
  storage.get()
  .then(persistedValue => {
    var collection = memoryCollection(persistedValue)
    // auto save
    collection.observe(newValue => storage.set(newValue).catch(console.error))
    return collection
  })
  .catch(err => console.error("Error loading data for collection", storage.name, err))
