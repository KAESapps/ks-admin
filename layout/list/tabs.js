import { createElement as el } from 'react'
import { observable } from 'mobservable'
import { observer } from 'mobservable-react'

export default function({
  tabs, // object of tab configs by key: { label, view }
  tabOrder,  // array: ordered list of keys
  defaultSelected,  // string: if (get/set)Selected are not defined, selection is handled internally and this defines the default selected key
  getSelected,  // (optional) function: returns the selected key
  setSelected,  // (optional) function: sets the selected key
}) {
  return function() {
    const viewArgs = arguments

    if (!getSelected) {
      // handle selection internally
      const $selected = observable(defaultSelected)
      getSelected = $selected
      setSelected = $selected
    }

    return observer(function () {
      var selected = getSelected()
      const view = tabs[selected].view
      return el('div', {},
        el('div', {
          className: 'ui horizontal fluid tabular menu red',
        }, tabOrder.map(id => {
          var itemLabel = tabs[id].label
          return el('a', {
              key: id,
              className: 'item ' + (selected === id ? 'active' : ''),
              onClick: () => setSelected(id),
            },
            typeof itemLabel === 'function' ? el(itemLabel) : itemLabel
          )
        })),
        el(view.apply(view, viewArgs))
      )
    })
  }
}
