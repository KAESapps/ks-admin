import create from 'lodash/create'

export default function (feathersClient, credentials) {
  const reauthenticate = () => {
    console.log('reconnected')
    feathersClient.authenticate(credentials).then(() => {
      feathersClient.emit('authenticated')
      console.log('reauthenticated')
    })
  }

  return feathersClient.authenticate(credentials)
    .then(res => {
      // automatically reauthenticate on disconnect/reconnect
      feathersClient.io.on('connect', reauthenticate)
      console.log('authenticated', res)

      // extend feathersClient.logout() method to destroy automatic reauth
      return create(feathersClient, {
        logout: function() {
          feathersClient.io.off('connect', reauthenticate)
          feathersClient.logout()
        },
      })
    })
}
