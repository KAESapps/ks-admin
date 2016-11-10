import {createElement as el} from 'react'
const defaultProps = {
  weight: 1,
}
export const layout = args => {
  const children = args.map((arg, i) => {
    let child, props = defaultProps
    if (Array.isArray(arg)) {
      [child, props] = arg
    } else {
      child = arg
    }
    if (typeof props === 'number') props = {weight: props}
    return el('div', {key: props.id || i, style: {flex: props.weight || null, display: 'flex'}}, el(child))
  })
  return () => el('div', {style: {display: 'flex', flexDirection: 'column', flex: 1}}, children)

}

export default args => context => {
  var children = args.map(child => {
    if (! Array.isArray(child)) return child(context)
    let props
    [child, props] = child
    return [child(context), props]
  })
  return layout(children)
}
