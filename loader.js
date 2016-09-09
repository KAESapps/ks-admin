import { createElement as el } from 'react'
import { observable } from 'mobservable'
import { observer } from 'mobservable-react'

export default promise => {
  const $loading = observable(true)
  var app
  promise.then(cmp => {
    app = cmp
    $loading(false)
  })

  return observer(() => {
    if ($loading()) return el('div', null, "Chargement...")
    return el(app)
  })
}