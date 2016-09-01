import { createElement as el } from 'react'
import assign from 'lodash/assign'

export const Box = (props) => {
  return el('div', {
    style: assign({
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
    }, props.style),
    className: props.className,
  }, props.children)
}

export const margin = (makeView) => {
  return function() {
    const view = makeView.apply(makeView, arguments)
    return function() {
      return el('div', { style: { padding: '1em' } }, el(view))
    }
  }
}
