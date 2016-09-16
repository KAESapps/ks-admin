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

export default Box
