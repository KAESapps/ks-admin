//TODO: mettre en commun h et v

import {createElement as el} from 'react'
import defaults from 'lodash/defaults'

const defaultProps = {
  weight: 1,
}
export const layout = args => {
  let childrenArg = args, containerProps = {}

  if (!Array.isArray(args)) {
    ({ children: childrenArg, containerProps } = args)
  }

  const children = childrenArg.map((arg, i) => {
    let child, props
    if (Array.isArray(arg)) {
      [child, props] = arg
      if (typeof props === 'number') props = {weight: props}
    } else {
      child = arg
    }
    props = defaults(props, defaultProps)
    return el('div', {
      key: props.id || i,
      style: defaults({ flex: props.weight }, props.style),
      className: props.className,
    }, child && el(child))
  })
  return () => el('div', defaults({
    style: defaults({ display: 'flex', flexDirection: 'row', flex: 1}, containerProps.style),
  }, containerProps), children)

}

export default args => context => {
  var children = args.map(child => {
    if (! Array.isArray(child)) return child && child(context)
    let props
    [child, props] = child
    return [child(context), props]
  }).filter(c => c)
  return layout(children)
}
