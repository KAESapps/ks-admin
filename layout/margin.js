import { createElement as el } from 'react'

export default (makeView) => {
  return function() {
    const view = makeView.apply(makeView, arguments)
    return function() {
      return el('div', { style: { padding: '1em' } }, el(view))
    }
  }
}
