import {memoize} from 'lodash'
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
    // memoize la création des vues pour ne pas les recréer quand la valeur de l'item change (ce qui peut arriver à cause de l'évaluation des 'conditions')
    const createTabView = memoize(activeTab => {
      var itemViewArg = tabsConfig[activeTab].view
      return tabView(collections, collectionId, itemId, itemViewArg)
    })
    return observer(function () {
      var activeTab = $activeTab()

      return el(Box, { style: { flexDirection: 'row' } },
        el(Box, { style: { flex: 1 }},
          el('div', { className: 'ui vertical fluid tabular menu red'}, tabsConfig.map((tab, index) => {
            if (tab.condition && !tab.condition(collections, collectionId, itemId)) return null
            return el('a', {
                key: index,
                className: 'item ' + (activeTab === index ? 'active' : ''),
                onClick: $activeTab.bind(null, index),
              },
              (typeof tab.label === 'function') ? el(tab.label(collections, collectionId, itemId)) : tab.label
            )
          }))
        ),
        el(Box, { style: { flex: 3, overflow: 'auto' } },
          el(createTabView(activeTab))
        )
      )
    })
  }
}
