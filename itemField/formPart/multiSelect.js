import React from 'react'
const el = React.createElement
import { observer } from 'mobservable-react'
import {assign, find, mapValues} from 'lodash'

import Input from 'react-bootstrap/lib/Input'


export default function (arg) {
  var options = Array.isArray(arg) ? arg : arg.options
  var format = arg.format === 'object' ? 'object' : 'list'
  return function (collections, collectionId, itemId, $patch, fieldArg) {
    var path = fieldArg.path
    var model = collections[collectionId].model
    var onChange = newVal => $patch.set(path, newVal)

    return observer(function () {
      var editing = $patch.has(path)
      var itemFieldValue = model.get(itemId).value[path] || emptySet(format)
      var value = editing ? $patch.get(path) : restrictToOptions(itemFieldValue, options, format)

      return el('div', null, options.map((o,i) =>
        el(Input, {
          key: i,
          type: 'checkbox',
          label: o[1],
          checked: isOptionSelected(value, o[0], format),
          onChange: ev => onChange(updateSet(value, o[0], ev.target.checked, format)),
        })
      ))
    })
  }
}

function isOptionSelected(itemValue, option, format) {
  return format === 'object' ?
    itemValue[option] :
    itemValue.indexOf(option) >= 0
}

function updateSet(set, option, checked, format) {
  return (format === 'object' ? updateObjectSet : updateArraySet)(set, option, checked)
}

function updateObjectSet(set, option, checked) {
  var out = assign({}, set)
  if (checked) {
    out[option] = true
  } else {
    delete out[option]
  }
  return out
}

function updateArraySet(set, option, checked) {
  if (checked) return set.concat(option)
  return set.filter(v => v !== option)
}

function emptySet(format) {
  return format === 'object' ? {} : []
}

function restrictToOptions(set, options, format) {
  return (format === 'object' ? restrictToOptionsObject : restrictToOptionsArray)(set, options)
}
function restrictToOptionsObject(set, options) {
  return mapValues(set, (v, k) => find(options, o => o[0] === k))
}
function restrictToOptionsArray(set, options) {
  return set.filter(k => find(options, o => o[0] === k))
}