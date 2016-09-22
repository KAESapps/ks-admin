export default function eventRegistry() {
  let cbs = []
  return {
    on: function(emitter, event, cb) {
      cbs.push({ emitter, event, cb })
      return emitter.on(event, cb)
    },
    clear: function() {
      cbs.forEach(({ emitter, event, cb }) => {
        // auto-detect listener removing method
        // TODO: works for our current needs, but we might want to make this more explicit in the future
        if (emitter.removeListener) {
          emitter.removeListener(event, cb)
        } else if (emitter.off) {
          emitter.off(event, cb)
        } else {
          throw "can't find a method for cancelling listener"
        }
      })
      cbs = []
    },
  }
}
