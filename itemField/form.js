import get from 'lodash/get'
import React from 'react'
const el = React.createElement
import { observer } from 'mobservable-react'
import { observable, map} from 'mobservable'
import Command from '../reactiveCollection/Command'

import Button from 'react-bootstrap/lib/Button'
import Input from 'react-bootstrap/lib/Input'

const preventDefault = ev => ev.preventDefault()

export var fieldEditor = function(collections, collectionId, itemId, $patch, options) {
  var model = collections[collectionId].model
  var path = options.path
  var type = options.type || 'text'
  var onChange = newVal => $patch.set(path, newVal)

  return observer(function() {
    var itemValue = model.get(itemId).value
    var partEditing = $patch.has(path)
    var value = partEditing ? $patch.get(path) : get(itemValue, path)

    if (typeof type === 'function') return el(type, {value, onChange})
    return el(Input, {
      type: type,
      // bsStyle: partEditing ? "success" : null,
      value: value || "",
      onChange: ev => onChange(type === 'number' ? ev.target.valueAsNumber : ev.target.value),
    })
  })
}

export var labeledPart = function(collections, collectionId, itemId, $patch, options) {
  var label = options.label
  var innerView = options.view
  var cmp = typeof innerView === 'function' ?
    innerView(collections, collectionId, itemId, $patch, options) :
    fieldEditor(collections, collectionId, itemId, $patch, options)

  return function () {
    return el(Input, {label: label, help: options.help},
      el(cmp)
    )
  }
}

export default function (parts) {
  return function (collections, collectionId, itemId) {
    var model = collections[collectionId].model
    var $patch = map()
    var save = new Command(() => {
      return model.patch(itemId, $patch.toJs()).then(() => $patch.clear())
    })
    var cmps = parts.map(part => {
      if (typeof part === 'function') return part(collections, collectionId, itemId, $patch)
      if (typeof part === 'string') part = {path: part, label: part, type: 'text'}
      if (Array.isArray(part)) part = {path: part[0], label: part[1], type: 'text'}
      return labeledPart(collections, collectionId, itemId, $patch, part)
    })

    return observer(function () {
      var editing = $patch.keys().length > 0
      return el('div', null,
        el('form', {onSubmit: preventDefault}, cmps.map((cmp, i) => el(cmp, {key: i}))),
        editing && save.status() === 'idle' ? el(Button, {
          onClick: save.trigger,
          // disabled: !editing || save.status() !== 'idle',
        }, 'enregistrer') : null,
        editing && save.status() === 'idle' ? el(Button, {
          // disabled: !editing || save.status() !== 'idle',
          onClick: () => $patch.clear(),
        }, "Annuler") : null,
        save.status() === 'idle' ? null : el('span', null, save.status('fr'))
      )
    })
  }
}
