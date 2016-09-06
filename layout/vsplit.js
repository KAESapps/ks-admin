import { createElement as el } from 'react'
import { observer } from 'mobservable-react'

import { Box } from './flex'

export default ({ topView: makeTopView, bottomView: makeBottomView }) => {
  return function() {
    const topView = makeTopView.apply(makeTopView, arguments)
    const bottomView = makeBottomView.apply(makeBottomView, arguments)
    return observer(function() {
      return el(Box, { },
        el(Box, { style: { overflow: 'auto', flexShrink: 0 } },
          el(topView)
        ),
        el(Box, { style: { overflow: 'auto', flexShrink: 0 } },
          el(bottomView)
        )
      )
    })
  }
}
