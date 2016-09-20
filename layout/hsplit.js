import { createElement as el } from 'react'
import { observer } from 'mobservable-react'

import { Box } from './flex'

export default ({ leftView: makeLeftView, rightView: makeRightView }) => {
  return function() {
    const leftView = makeLeftView.apply(makeLeftView, arguments)
    const rightView = makeRightView.apply(makeRightView, arguments)
    return observer(function() {
      return el(Box, { style: { flexDirection: 'row' }},
        el(Box, { style: { overflow: 'auto', flexShrink: 0 } },
          el(leftView)
        ),
        el(Box, { style: { overflow: 'auto', flexShrink: 0 } },
          el(rightView)
        )
      )
    })
  }
}