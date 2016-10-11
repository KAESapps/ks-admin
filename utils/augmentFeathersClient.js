import create from 'lodash/create'
import createEventRegistry from './eventRegistry'
import { observable } from 'mobservable'

/*
 Augment a feathers client (v2.0.1) with:
 - auto-reauthentication on disconnect/reconnect
 - new events: "authenticated" & "disconnect"
 */

export default function (feathersClient) {
  const eventRegistry = createEventRegistry()
  const $isAuthenticated = observable(false)

  return create(feathersClient, {
    isAuthenticated: () => $isAuthenticated(),
    authenticate: function(credentials) {
      if ($isAuthenticated()) {
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
            .catch(err => {
              feathersClient.emit('notAuthenticated')
              throw err
            })
          })

          eventRegistry.on(feathersClient.io, 'disconnect', function() {
            console.log('feathers client disconnected')
            feathersClient.emit('disconnect')
          })

          console.log('authenticated', res)
          feathersClient.emit('authenticated')
          $isAuthenticated(true)
        })
      .catch(err => {
        feathersClient.emit('notAuthenticated')
        throw err
      })
    },
    logout: function() {
      // clear listeners
      eventRegistry.clear()
      feathersClient.logout()
      $isAuthenticated(false)
      feathersClient.emit('notAuthenticated')
    },

    on: feathersClient.on.bind(feathersClient),
    emit: feathersClient.emit.bind(feathersClient),
  })
}
