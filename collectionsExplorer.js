import {get} from 'lodash'
import React from 'react'
const el = React.createElement
import { observable, transaction } from 'mobservable'
import { observer } from 'mobservable-react'
import { Box } from './layout/flex'

import Command from './reactiveCollection/Command'

function normalizeEvent (ev, type) {
  if (type === 'number') return ev.target.valueAsNumber
  return ev.target.value
}

export var fieldValueViewDefault = function (collections, collection, itemId, fieldArg) {
  var fieldId = fieldArg.path
  var fieldType = fieldArg.type || 'text'
  var model = typeof collection === 'string' ? collections[collection].model : collection
  var $inputValue = observable(null)
  var $editing = observable(false)
  var cancel = $editing.bind(null, false)
    var save = new Command(() => {
    return model.patch(itemId, {[fieldId]: $inputValue()}).then($editing.bind(null, false))
  })

  return observer(function () {
    var editing = $editing()
    if (editing) {
      return el('div', {
        className: 'ui action input',
      },
        el(fieldType === 'textarea' ? 'textarea' : 'input', {
          type: fieldType,
          value: $inputValue(),
          onChange: ev => $inputValue(normalizeEvent(ev, fieldType)),
        }),
        el('button', { className: 'ui button', key: 'cancel', onClick: cancel}, "annuler"),
        el('button', { className: 'ui primary button', key: 'save', onClick: save.trigger},
          save.status() === 'idle' ? 'enregistrer' : save.status('fr')
        )
      )
    }
    var fieldValue = get(model.get(itemId).value, fieldId)
    var edit = function (ev) {
      transaction(function () {
        $editing(true)
        $inputValue(ev.target.value ? normalizeEvent(ev, fieldType) : fieldValue)
      })
    }
    return el('div', {
      className: 'ui action input',
    },
      el(fieldType === 'textarea' ? 'textarea' : 'input', {
        type: fieldType,
        value: fieldValue || "",
        onChange: edit,
      }),
      el('button', { className: 'ui icon button', key: 'edit', onClick: edit},
        el('i', { className: "write icon" })
      )
    )
  })
}

export var convertFieldArg = function(fieldArg) {
  if (typeof fieldArg === 'string') fieldArg = {label: fieldArg, path: fieldArg}
  if (Array.isArray(fieldArg)) {
    var path = fieldArg[0]
    fieldArg = (typeof fieldArg[1] === 'object') ? fieldArg[1] : {label: fieldArg[1]}
    fieldArg.path = path
  }
  return fieldArg
}

export var fieldViewDefault = function (fieldArg) {
  fieldArg = convertFieldArg(fieldArg)
  return function(collections, collectionId, itemId) {
    var fieldValueView = (typeof fieldArg.type === 'function' ?
      fieldArg.type :
      fieldValueViewDefault
    )(collections, collectionId, itemId, fieldArg)

    const labelView = (typeof fieldArg.label === 'function' ? fieldArg.label(collections, collectionId, itemId, fieldArg) : () => el('label', {}, fieldArg.label))

    return function () {
      return el('div', {
        className: 'ui form',
      },
        el ('div', { className: 'field'},
          el(labelView),
          el(fieldValueView),
          el('div', { className: 'help' }, fieldArg.tip)
        )
      )
    }
  }
}

export var innerItemViewDefault = function (collections, collectionId, itemId, arg) {
  if (typeof arg === 'function') return arg(collections, collectionId, itemId)
  var fields = arg.map((field) =>
    (typeof field === 'function' ?
      field : fieldViewDefault(field)
    )(collections, collectionId, itemId)
  )
  return function () {
    return el('div', {}, fields.map((field, index) =>
      el(field, {key: index})
    ))
  }
}

export const itemViewWithDefaults = function(arg = {}) {
  return function (collections, collectionId, itemId, back) {
    var model = collections[collectionId].model
    var itemViewArg = arg.view || collections[collectionId].views.item // ici, ça ne peut pas être une fonction, c'est forcément une config
    // si c'est un string, ou un array, c'est en fait directements les fields
    // TODO: pas très clair, à remanier
    if (typeof itemViewArg === 'string') itemViewArg = [itemViewArg] // un seul champ
    if (Array.isArray(itemViewArg)) itemViewArg = {view: itemViewArg}
    var preventDelete = itemViewArg.preventDelete
    var enableRefresh = itemViewArg.enableRefresh || !model.isReactive
    var innerItemView = (typeof itemViewArg.view === 'function') ?
      itemViewArg.view(collections, collectionId, itemId) :
      innerItemViewDefault(collections, collectionId, itemId, itemViewArg.view)
    var del = () => {
      model.remove(itemId).then(back)
    }

    return observer(function () {
      if (itemId === null) return null

      var item = model.get(itemId)
      var itemLabel = itemId
      if (item.loaded && itemViewArg.label) itemLabel = (typeof itemViewArg.label === 'function') ? itemViewArg.label(item.value) : get(item.value, itemViewArg.label)
      return el(Box, {},
        el('div', { className: 'ui inverted menu' },
          el('a', { className: 'item', onClick: back },
            el('i', { className: 'angle left icon' }),
            'retour'
          ),
          el('span', {className: 'item'}, itemLabel),
          el('div', { className: 'right menu'},
            enableRefresh && el('a', { className: 'item', onClick: model.refresh },
              el('i', { className: 'refresh icon' })
            ),
            !preventDelete && el('div', { className: 'ui simple dropdown item' },
              el('i', { className: 'setting icon' }),
              el('i', { className: 'dropdown icon' }),
              el('div', { className: 'menu' },
                el('a', { className: 'red item ', onClick: del }, 'supprimer')
              )
            )
          )
        ),
        !(item.loaded) ?
          el('div', {}, 'chargement...'):
          item.value ?
            el(innerItemView) :
            el('div', {}, 'Elément inexistant')
      )
    })
  }
}

export var itemViewDefault = itemViewWithDefaults()

const listItemViewWithDefaults = function(arg) {
  return function (collections, collectionId, $selectedItem) {
    var model = collections[collectionId].model
    var labelArg = arg || collections[collectionId].views.list
    if (typeof labelArg === 'object' && labelArg.view) labelArg = labelArg.view
    var header = '_id', body
    if (typeof labelArg === 'object' && 'header' in labelArg) {
      header = labelArg.header
      body = labelArg.body
    } else {
      header = labelArg
      body = '_id'
    }

    header = Array.isArray(header) ? header : [header]
    var headerParts = header.map(arg => typeof arg === 'function' ?
      arg(collections, collectionId):
      arg
    )

    if (body) {
      body = Array.isArray(body) ? body : [body]
      var bodyCmps = body.map(arg => typeof arg === 'function' ?
        arg(collections, collectionId):
        arg
      )
    }


    return observer(function ({itemId}) {
      var item = model.get(itemId)
      var loaded = item.loaded

      var headerValue = loaded ?
        headerParts.map((part, i) => {
          return el('span', { style: (i < headerParts.length - 1) ? {'marginRight': '1ex' } : null, key: i}, (typeof part === 'string') ?
            get(item.value, part) :
            el(part, {itemId: itemId })
          )
        }) :
        itemId

      var children = body ?
        loaded ?
          bodyCmps.map((cmp, i) => (typeof cmp === 'string') ?
            get(item.value, cmp) :
            el(cmp, {key: i, itemId: itemId})) :
          'chargement...' :
        null
      return el('a', {
        className: 'item' + ($selectedItem && ($selectedItem() === itemId) ? ' active' : ''),
        onClick: $selectedItem && ((ev) => {
          $selectedItem(itemId)
          ev.stopPropagation()
        }),
      },
        el('div', { className: 'ui medium header', style: { overflow: 'hidden', textOverflow: 'ellipsis' } }, headerValue),
        children
      )
    })
  }
}

export const listOnlyViewWithDefaults = function(arg) {
  var defaultListItemView = listItemViewWithDefaults(arg)

  return function (collections, collectionId, $itemId) {
    var model = collections[collectionId].model
    var args = arg || collections[collectionId].views.list
    var sortArg = (typeof args === 'object') ? args.orderBy : null
    var limitArg = (typeof args === 'object') ? args.limit : null
    var listItemView = defaultListItemView(collections, collectionId, $itemId)
    return observer(function() {
      const queryArgs = {}
      if (sortArg) {
        queryArgs.$sort = sortArg
      }
      if (limitArg) {
        queryArgs.$limit = limitArg
      }

      var itemIds = model.query(queryArgs)
      if (!(itemIds.loaded)) {
        return el('div', {}, 'chargement...')
      }

      if (itemIds.value.length > 0) {
        return el('div', { className: 'ui fluid vertical menu' }, itemIds.value.map(id =>
          el(listItemView, {key: id, itemId: id})
        ))
      } else {
        return el('div')
      }
    })
  }
}


export const listViewWithDefaults = function(arg) {
  var innerlistViewDefault = listOnlyViewWithDefaults(arg)

  return function (collections, collectionId, $itemId) {
    var model = collections[collectionId].model
    var args = arg || collections[collectionId].views.list
    var preventAdd = (typeof args === 'object') ? args.preventAdd : false
    var add = () => model.add({}).then(itemId => {
      $itemId(itemId)
    })
    var innerView = (typeof args.view === 'function' ? args.view : innerlistViewDefault)(collections, collectionId, $itemId)

    const addLabel = args.addLabel || "Ajouter un élément"

    return observer(function () {
      return el(Box, {},
        !preventAdd && el('div', { className: 'ui inverted menu' },
          el('div', { className: 'item' },
              el('div', { className: 'ui primary button', onClick: add },
                el('i', { className: 'plus icon' }),
                addLabel
              )
          )
        ),
        el(Box, {},
          el(innerView)
        )
      )
    })
  }
}

export var listViewDefault = listViewWithDefaults()

export const configureCollectionEditor = function(arg) {
  return function (collections, collectionId) {
    var selected = observable(null)
    var back = selected.bind(null, null)
    var listViewArg = arg.list
    var listCmp = (typeof listViewArg === 'function' ? listViewArg : listViewDefault)(collections, collectionId, selected)
    var itemViewArg = arg.item
    var itemView = (typeof itemViewArg === 'function') ? itemViewArg : itemViewDefault
    return observer(function () {
      var itemId = selected()
      return el(Box, {}, [
        el(Box, {key: 'list', style: {display: itemId ? 'none' : undefined}},
        // on garde la liste montée pour ne pas relacher le cache de données
          el(listCmp)
        ),
        // on crée un nouveau composant (une nouvelle classe) quand itemId change (et pas une classe qui change d'itemId)
        // cela permet d'avoir un état frais lorsque l'on change d'item
        // par exemple, s'il y a des onglets dans l'itemView, on n'affiche pas l'onglet précédent quand on change d'item mais on affiche bien celui par défaut
        // si ce n'est pas le comportement souhaité, il faut changer de collectionEditorView
        itemId ? el(itemView(collections, collectionId, itemId, back), {key: 'item'}) : null,
      ])
    })
  }
}

export var collectionEditor = function (collections, collectionId) {
  return configureCollectionEditor(collections[collectionId].views)(collections, collectionId)
}

var collectionsList = function (collections, select) {
  return observer(function () {
    var selected = select()
    return el('div', {
      className: 'ui horizontal fluid tabular menu red',
    }, Object.keys(collections).map(id =>
      el('a', {
        key: id,
        className: 'item ' + (selected === id ? 'active' : ''),
        onClick: () => select(id),
      },
        collections[id].label
      )
    ))
  })
}

var collectionsSwitcher = function (collections, selected) {
  return observer(function () {
    var id = selected()
    if (!id) return el('div', {}, 'dashboard')
    if (typeof collections[id].views === 'function') {
      return el(collections[id].views(collections, id))
    }
    return el(collectionEditor(collections, id))
  })
}


export default function (collections) {
  var selected = observable(collections.defaultCollection)
  return function () {
    return el('div', {},
      el(collectionsList(collections, selected)),
      el(collectionsSwitcher(collections, selected))
    )
  }
}
