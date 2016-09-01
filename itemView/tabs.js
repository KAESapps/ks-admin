import React from 'react'
const el = React.createElement
import { observable} from 'mobservable'
import { observer } from 'mobservable-react'

import {innerItemViewDefault} from '../collectionsExplorer'
import { Box, margin } from '../layout/flex'

// c'est purement un décorateur graphique pour faire un multi-itemView... aucune logique sur les données
export default function (tabs) {
  return function (collections, collectionId, itemId) {
    var $activeTab = observable(0)
    return observer(function () {
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
          el(margin(innerItemViewDefault)(collections, collectionId, itemId, itemViewArg))
        )
      )
    })
  }
}
