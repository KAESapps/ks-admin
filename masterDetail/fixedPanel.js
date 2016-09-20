import { createElement as el } from 'react'
import { observable } from 'mobservable'
import { observer } from 'mobservable-react'

import { Box } from '../layout/flex'

import { itemViewWithDefaults, listViewWithDefaults } from '../collectionsExplorer'

export default function(args = {}) {
  let { setActive, getActive } = args

  return function ({ collections, collection }) {
    var listViewCtr = (typeof args.list === 'function') ? args.list : listViewWithDefaults(args.list)
    var itemViewCtr = (typeof args.item === 'function') ? args.item : itemViewWithDefaults(args.item)

    let getSetActive
    if (!setActive && !getActive) {
      getSetActive = observable(null)
      setActive = getSetActive
      getActive = getSetActive
    } else {
      getSetActive = function(id) {
        if (arguments.length > 0) {
          return setActive(id)
        } else {
          return getActive()
        }
      }
    }


    var back = setActive.bind(null, null)
    var listCmp = listViewCtr(collections, collection, getSetActive)
    var noItemSelectedCmp = null
    if (typeof args.noItemSelected === 'function') {
      noItemSelectedCmp = el(args.noItemSelected(collections, collection, setActive))
    }

    return observer(function () {
      var itemId = getActive()
      return el(Box, { style: { flexDirection: 'row' } },
        el(Box, {
          style: {
            flex: 1,
            overflow: 'auto',
          },
        },
        // on garde la liste montée pour ne pas relacher le cache de données
          el(listCmp)
        ),
        // on crée un nouveau composant (une nouvelle classe) quand itemId change (et pas une classe qui change d'itemId)
        // cela permet d'avoir un état frais lorsque l'on change d'item
        // par exemple, s'il y a des onglets dans l'itemView, on n'affiche pas l'onglet précédent quand on change d'item mais on affiche bien celui par défaut
        // si ce n'est pas le comportement souhaité, il faut changer de collectionEditorView
        el(Box, {
          style: {
            flex: 3,
            overflow: 'auto',
          },
        },
          itemId ? el(itemViewCtr(collections, collection, itemId, back, getSetActive)) : noItemSelectedCmp
        )
      )
    })
  }
}
