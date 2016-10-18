import { createElement as el } from 'react'

import { Box } from './flex'

export const container = ({leftView, rightView}) => () => {
  return el(Box, { style: { flexDirection: 'row' } },
    el(Box, { style: { overflow: 'auto', flexShrink: 0 } },
      el(leftView)
    ),
    el(Box, { style: { overflow: 'auto', flexShrink: 0 } },
      el(rightView)
    )
  )
}

export default ({ leftView: makeLeftView, rightView: makeRightView }) => {
  return function() {
    const leftView = makeLeftView.apply(makeLeftView, arguments)
    const rightView = makeRightView.apply(makeRightView, arguments)
    return container({leftView, rightView})
  }
}
