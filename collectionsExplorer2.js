import tabs from './layout/list/tabs'
import { observable } from 'mobservable'
import { observer } from 'mobservable-react'
import { createElement as el } from 'react'
import isFunction from 'lodash/isFunction'
import keys from 'lodash/keys'
import create from 'lodash/create'
import { collectionEditor } from './collectionsExplorer'

const masterDetail = function({ views, defaultActive }) {
  return function(context) {
    var selected = observable(defaultActive)

    const getItems = () => keys(context.collections)
    const getItemLabel = (id) => context.collections[id].label
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