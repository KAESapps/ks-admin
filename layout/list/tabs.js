import { createElement as el } from 'react'
import { observer } from 'mobservable-react'

export default function({ getItems, getItemLabel, getSelected, setSelected, getContentView }) {
  return observer(function () {
    var selected = getSelected()
    return el('div', {},
      el('div', {
        className: 'ui horizontal fluid tabular menu red',
      }, getItems().map(id =>
        el('a', {
          key: id,
          className: 'item ' + (selected === id ? 'active' : ''),
          onClick: () => setSelected(id),
        },
          getItemLabel(id)
        )
      )),
      el(getContentView(selected))
    )
  })
}
