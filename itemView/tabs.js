import React from 'react'
const el = React.createElement
import { observable} from 'mobservable'
import { observer } from 'mobservable-react'

import {innerItemViewDefault} from '../collectionsExplorer'

// c'est purement un décorateur graphique pour faire un multi-itemView... aucune logique sur les données
export default function (tabs) {
  return function (collections, collectionId, itemId) {
    var $activeTab = observable(0)
    return observer(function () {
      var activeTab = $activeTab()
      var itemViewArg = tabs[activeTab].view
      return el('div', { className: 'ui grid' },
        el('div', { className: 'four wide column' },
          el('div', { className: 'ui vertical fluid tabular menu red'}, tabs.map((tab, index) =>
            el('a', {
              key: index,
              className: 'item ' + (activeTab === index ? 'active' : ''),
              onClick: $activeTab.bind(null, index)}, tab.label)
          ))
        ),
        el('div', { className: 'twelve wide column' },
          el(innerItemViewDefault(collections, collectionId, itemId, itemViewArg))
        )
      )
    })
  }
}
