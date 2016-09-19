import tabs from './layout/list/tabs'
import { observable } from 'mobservable'
import isFunction from 'lodash/isFunction'
import keys from 'lodash/keys'
import create from 'lodash/create'
import mapValues from 'lodash/mapValues'
import { collectionEditor } from './collectionsExplorer'

const masterDetail = function({ viewOrder, views = {}, defaultActive }) {
  return function(context) {
    var selected = observable(defaultActive)

    const tabOrder = viewOrder || keys(context.collections)
    const tabConfigs = mapValues(context.collections, (collection, collId) => {
      if (!views[collId] && !context.collections[collId].views) {
        return
      }
      const label = context.collections[collId].label
      return {
        label: typeof label === 'function' ? label(context) : label,
        view: (context) => views[collId] ? views[collId](create(context, { collection: collId })) : collectionEditor(context.collections, collId),
      }
    })

    return tabs({ tabOrder, tabs: tabConfigs, getSelected: selected, setSelected: selected })(context)
  }
}


export default function ({ view, context }) {
  if (!isFunction(view)) {
    view = masterDetail(view)
  }
  return view(context)
}
