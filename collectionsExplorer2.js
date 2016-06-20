import tabs from './layout/list/tabs'
import { observable } from 'mobservable'
import isFunction from 'lodash/isFunction'
import keys from 'lodash/keys'
import create from 'lodash/create'
import { collectionEditor } from './collectionsExplorer'

const masterDetail = function({ viewOrder, views = {}, defaultActive }) {
  return function(context) {
    var selected = observable(defaultActive)

    const getItems = () => (viewOrder || keys(context.collections))
    const getItemLabel = (id) => {
      const label = context.collections[id].label
      return typeof label === 'function' ? label(context) : label
    }
    const getContentView = (id) => {
      return views[id] ? views[id](create(context, { collection: id })) : collectionEditor(context.collections, id)
    }

    return tabs({ getItems, getItemLabel, getSelected: selected, setSelected: selected, getContentView })
  }
}


export default function ({ view, context }) {
  if (!isFunction(view)) {
    view = masterDetail(view)
  }
  return view(context)
}
