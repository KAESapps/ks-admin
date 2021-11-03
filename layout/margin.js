import { createElement as el } from 'react'
import assertArgs from 'assert-args'
import defaults from 'lodash/defaults'
import Box from '../layout/flex'

export default function () {
  const { opts, view } = assertArgs(arguments, {
    '[opts]': 'object',
    view: 'function',
  })

  const margins = defaults(opts, { l: '1em', r: '1em', t: '1em', b: '1em' })

  return function() {
    const reactCmp = view.apply(view, arguments)
    return function() {
      return el(Box, { style: {
        paddingLeft: margins.l,
        paddingRight: margins.r,
        paddingTop: margins.t,
        paddingBottom: margins.b,
        overflow: null,
      } }, el(reactCmp))
    }
  }
}
