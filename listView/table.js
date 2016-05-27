import React from 'react'
const el = React.createElement
import { observable} from 'mobservable'
import { observer } from 'mobservable-react'
import {convertFieldArg, fieldValueViewDefault} from '../collectionsExplorer'
import Table from 'react-semantify/lib/collections/table'
import Icon from 'react-semantify/lib/elements/icon'

var fieldView = function (collections, collectionId, itemId, fieldArg) {
  var fieldArg = convertFieldArg(fieldArg)
  var fieldValueView = (typeof fieldArg.type === 'function' ?
    fieldArg.type :
    fieldValueViewDefault
  )(collections, collectionId, itemId, fieldArg)

  return function () {
    return el(fieldValueView)
  }
}


export default function ({fields, pageSize, sort, selectable = true }) {
  pageSize = pageSize || 10
  return function (collections, collectionId, $itemId) {
    var model = collections[collectionId].model
    var currentPage = observable(0)
    var previous = () => currentPage(currentPage()-1)
    var next = () => currentPage(currentPage()+1)
    return observer(function () {
      var queryParams = {
        $skip: currentPage()*pageSize,
        $limit: pageSize,
      }
      if (sort) {queryParams.$sort = sort}
      var itemIds = model.query(queryParams)
      if (!itemIds.loaded) return el('div', null, 'chargement...')

      return el('div', null,
        el(Table, { className: (selectable ? 'definition selectable' : '') },
          el('thead', null,
            el('tr', null,
              selectable && el('th'),
              fields.map((f, key) => {
                var fieldArg = convertFieldArg(f)
                return el('th', {key}, fieldArg.label)
              })
            )
          ),
          el('tbody', null,
            itemIds.value.map(id => {
              return el('tr', {
                key: id,
                onClick: () => selectable && $itemId(id),
                style: { cursor: selectable ? 'pointer' : null }
              },
                selectable && el('td', null,
                  el(Icon, {className: 'chevron circle right', style: { color: 'gray' } })
                ),
                fields.map((f, key) => {
                  var cmp = fieldView(collections, collectionId, id, f)
                  return el('td', {key},
                    el(cmp)
                  )
                }))
            })
          ),
          el('tfoot', { className: 'full-width' },
            el('tr', null,
              el('th', { colSpan: fields.length + 1 },
                el('div', { className: 'ui menu pagination right floated'},
                  el('a', { className: 'item' + (currentPage()+1 <= 1 ? ' disabled' : ''), onClick: previous },
                    el(Icon, { className: 'chevron left' })
                  ),
                  el('span', {className: 'disabled item' }, "" + (currentPage()+1)),
                  el('a', { className: 'item', onClick: next },
                    el(Icon, { className: 'chevron right' })
                  )
                )
              )
            )
          )
        )
      )
    })
  }
}
