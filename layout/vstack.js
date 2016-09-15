import { createElement as el } from 'react'
import { observer } from 'mobservable-react'

export default (viewMakers) => {
  return function() {
    const viewArgs = arguments
    const views = viewMakers.map(viewMaker => viewMaker.apply(viewMaker, viewArgs))
    return observer(function() {
      return el('div', { }, views.map((view, i) => {
        return el(view, { key: i })
      }))
    })
  }
}
