import React from 'react'
const el = React.createElement
import { observable} from 'mobservable'
import { observer } from 'mobservable-react'

import {innerItemViewDefault} from '../collectionsExplorer'
import Box from '../layout/flex'
import margin from '../layout/margin'

const tabView = margin(innerItemViewDefault)

// c'est purement un décorateur graphique pour faire un multi-itemView... aucune logique sur les données
export default function (tabsConfig) {
  return function (collections, collectionId, itemId) {
    var $activeTab = observable(0)

    return observer(function () {
      const tabs = tabsConfig.filter(tab => tab.condition ? tab.condition(collections, collectionId, itemId) : true)
      var activeTab = $activeTab()
      var itemViewArg = tabs[activeTab].view

      return el(Box, { style: { flexDirection: 'row' } },
        el(Box, { style: { flex: 1 }},
          el('div', { className: 'ui vertical fluid tabular menu red'}, tabs.map((tab, index) =>
            el('a', {
                key: index,
                className: 'item ' + (activeTab === index ? 'active' : ''),
                onClick: $activeTab.bind(null, index),
              },
              (typeof tab.label === 'function') ? el(tab.label(collections, collectionId, itemId)) : tab.label
            )
          ))
        ),
        el(Box, { style: { flex: 3, overflow: 'auto' } },
          el(tabView(collections, collectionId, itemId, itemViewArg))
        )
      )
    })
  }
}
