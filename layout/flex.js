import { createElement as el } from 'react'
import assign from 'lodash/assign'

export const Box = (props) => {
  return el('div', assign({}, props, {
    style: assign({
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
    }, props.style),
  }))
}

export default Box
