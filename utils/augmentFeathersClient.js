import create from 'lodash/create'
import createEventRegistry from './eventRegistry'

/*
 Augment a feathers client (v2.0.1) with:
 - auto-reauthentication on disconnect/reconnect
 - new events: "authenticated" & "disconnect"
 */

export default function (feathersClient) {
  const eventRegistry = createEventRegistry()

  return create(feathersClient, {
    authenticate: function(credentials) {
      if (this.loggedIn) {
        throw "authenticate() cannot be called twice unless you logout"
      }
      return feathersClient.authenticate(credentials)
        .then(res => {
          // automatically reauthenticate on disconnect/reconnect
          eventRegistry.on(feathersClient.io, 'connect', function() {
            console.log('reconnected')
            feathersClient.authenticate(credentials).then(function() {
              feathersClient.emit('authenticated')
              console.log('reauthenticated')
            })
          })

          eventRegistry.on(feathersClient.io, 'disconnect', function() {
            console.log('feathers client disconnected')
            feathersClient.emit('disconnect')
          })

          this.loggedIn = true
          console.log('authenticated', res)
          feathersClient.emit('authenticated')
        })
    },
    logout: function() {
      // clear listeners
      eventRegistry.clear()
      feathersClient.logout()
      this.loggedIn = false
      console.log('logout')
      feathersClient.emit('logout')
    },
  })
}
