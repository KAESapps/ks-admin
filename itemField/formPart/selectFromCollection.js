import {get} from 'lodash'
import React from 'react'
const el = React.createElement
import { observable } from 'mobservable'
import { observer } from 'mobservable-react'

const itemPicker = function({collection, labelPath, onChange}){
  var $srch = observable('')
  var $skip = observable(0)
  var prev = () => $skip($skip()-10)
  var nxt = () => $skip($skip()+10)

  return observer(function(value){
    var results = collection.query({$sort: {[labelPath]: 1}, $limit: $skip()+10})
    return el('div', {style: {position: 'absolute'}},
      el('input', {value: $srch(), onChange: ev => $srch(ev.target.value)}),
      el('span', null, results.loading ? 'searching...' : ''),
      el('div', null, results.value.slice($skip(), 10).map(optionId => {
        var optionLabel = collection.get(optionId).loaded ? get(collection.get(optionId).value, labelPath) : '...'
        return el('div', {key: optionId, onClick: ()=> onChange(optionId)}, optionLabel)
      })),
      el('div', null,
        el('button', {onClick: prev}, '<'),
        el('button', {onClick: nxt}, '>')
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
          onClick: toogle,
        }, valueLabel),
        $opened() ? el(itemPickerCmp, {value}) : null
      )
    })
  }
}