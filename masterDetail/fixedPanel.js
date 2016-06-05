import { createElement as el } from 'react'
import { observable } from 'mobservable'
import { observer } from 'mobservable-react'

import { innerItemViewDefault } from '../collectionsExplorer'

export var makeInnerItemViewDefault = function(arg) {
  return function(collections, collectionId, itemId) {
    return innerItemViewDefault(collections, collectionId, itemId, arg)
  }
}

export default function(args) {
  var listViewCtr = args.list
  var itemViewCtr = (typeof args.item === 'function') ? args.item : makeInnerItemViewDefault(args.item.view)

  return function (collections, collectionId) {
    var selected = observable(null)
    var back = selected.bind(null, null)
    var listCmp = listViewCtr(collections, collectionId, selected)

    return observer(function () {
      var itemId = selected()
      return el('div', { className: 'ui equal width grid divided' },
        el('div', {
          className: 'four wide column',
        },
        // on garde la liste montée pour ne pas relacher le cache de données
          el(listCmp)
        ),
        // on crée un nouveau composant (une nouvelle classe) quand itemId change (et pas une classe qui change d'itemId)
        // cela permet d'avoir un état frais lorsque l'on change d'item
        // par exemple, s'il y a des onglets dans l'itemView, on n'affiche pas l'onglet précédent quand on change d'item mais on affiche bien celui par défaut
        // si ce n'est pas le comportement souhaité, il faut changer de collectionEditorView
        el('div', {
          className: 'column',
        },
          itemId ? el(itemViewCtr(collections, collectionId, itemId, back)) : null
        )
      )
    })
  }
}
