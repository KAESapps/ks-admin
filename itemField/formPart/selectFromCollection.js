import {get} from 'lodash'
import React from 'react'
const el = React.createElement
import { observable } from 'mobservable'
import { observer } from 'mobservable-react'
import escapeStringRegexp from 'escape-string-regexp'

const autoFocusRef = node => node && node.focus()

const itemPicker = function({collection, labelPath, onChange}){
  var $srch = observable('')
  var $skip = observable(0)
  var prev = () => $skip($skip()-10)
  var nxt = () => $skip($skip()+10)

  return observer(function({value}){
    var results = collection.query({$sort: {[labelPath]: 1}, $limit: 10, $skip: $skip(), [labelPath]: { regex: { template: `.*${escapeStringRegexp($srch())}.*`, options: 'i' } } })

    return el('div', {
        className: 'ui vertical menu',
        style: {
          position: 'absolute',
          zIndex: 1,
          background: 'white',
        },
      },
      results.loading ? el('span', { className: 'item' }, 'searching...') : null,
      el('input', {
        className: 'item',
        placeholder: "Rechercher",
        value: $srch(),
        onChange: ev => $srch(ev.target.value),
        ref: autoFocusRef,
      }),
      results.value.map(optionId => {
        var optionLabel = collection.get(optionId).loaded ? get(collection.get(optionId).value, labelPath) : '...'
        return el('a', { key: optionId, className: 'item', onClick: () => onChange(optionId) }, optionLabel)
      }),
      el('div', { className: 'item' },
        el('div', { className: 'ui pagination menu right floated' },
          el('a', { className: 'item', onClick: prev },
            el('i', { className: 'icon chevron left' })
          ),
          el('a', { className: 'item', onClick: nxt },
            el('i', { className: 'icon chevron right' })
          )
        )
      )
    )
  })
}

export default function (arg) {
  var optionsCollection = arg.collection
  var labelPath = arg.labelPath
  var placeholder = arg.placeholder || ''

  return function (collections, itemsCollectionId, itemId, $patch, fieldArg) {
    if (typeof optionsCollection === 'string') optionsCollection = collections[optionsCollection].model
    var path = fieldArg.path
    var itemsModel = collections[itemsCollectionId].model
    var $opened = observable(false)
    var onChange = value => {
      $opened(false)
      $patch.set(path, value)
    }
    var itemPickerCmp
    var toogle = () => {
      if (!$opened()) {
        itemPickerCmp = itemPicker({collection: optionsCollection, labelPath, onChange})
        $opened(true)
      } else {
        $opened(false)
      }
    }

    return observer(function () {
      var editing = $patch.has(path)
      var value
      if (editing) {
        value = $patch.get(path)
      } else {
        var item = itemsModel.get(itemId)
        if (!item.loaded) return el('button', null, '...')
        value = get(item.value, path)
      }
      var valueLabel
      if (value) {
        var option = optionsCollection.get(value)
        valueLabel = option.loaded ? get(option.value, labelPath) : '...'
      } else {
        valueLabel = placeholder
      }

      return el('div', {style: {position: 'relative'}},
        el('button', {
          className: 'ui right labeled icon button',
          onClick: toogle,
        },
          el('i', { className: 'dropdown icon'}),
          valueLabel
        ),
        $opened() ? el(itemPickerCmp, {value}) : null
      )
    })
  }
}
