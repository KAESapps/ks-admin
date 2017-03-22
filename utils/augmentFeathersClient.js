import create from 'lodash/create'
import createEventRegistry from './eventRegistry'
import { observable } from 'mobservable'

/*
 Augment a feathers client (v2.0.1) with:
 - auto-reauthentication on disconnect/reconnect
 - new events: "authenticated" & "disconnect"
 */

const authenticateWithRetry = function(feathersClient, eventRegistry, credentials) {
  if (feathersClient.io.connected) {
    return new Promise(function(resolve, reject) {
      eventRegistry.once(feathersClient.io, 'disconnect', function() {
        feathersClient.emit('disconnect')
        console.log('feathers client disconnected')
        authenticateWithRetry(feathersClient, eventRegistry, credentials).then(resolve).catch(reject)
      })

      feathersClient.authenticate(credentials)
        .then(function() {
          feathersClient.emit('authenticated')
          console.log('reauthenticated')
          resolve()
        })
        .catch(err => {
          feathersClient.emit('notAuthenticated')
          console.log('not-authenticated', err)
          reject(err)
        })
    })
  } else {
    return new Promise(function(resolve, reject) {
      eventRegistry.once(feathersClient.io, 'connect', function() {
        console.log('connected')
        authenticateWithRetry(feathersClient, eventRegistry, credentials).then(resolve).catch(reject)
      })
    })
  }
}

export default function (feathersClient) {
  const eventRegistry = createEventRegistry()
  const $isAuthenticated = observable(false)

  return create(feathersClient, {
    isAuthenticated: () => $isAuthenticated(),
    authenticate: function(credentials) {
      if ($isAuthenticated()) {
        throw "authenticate() cannot be called twice unless you logout"
      }
      $isAuthenticated('authenticating')
      return authenticateWithRetry(feathersClient, eventRegistry, credentials)
        .then(() => {
          $isAuthenticated(true)
        })
        .catch(err => {
          $isAuthenticated(false)
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
