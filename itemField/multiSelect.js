import React from 'react'
const el = React.createElement
import { observer } from 'mobservable-react'
import { observable, transaction } from 'mobservable'
import Command from '../reactiveCollection/Command'

import Input from 'react-bootstrap/lib/Input'
import Button from 'react-bootstrap/lib/Button'


export default function (arg) {
  var options = Array.isArray(arg) ? arg : arg.options
  var format = arg.format === 'object' ? 'object' : 'list'
  return function (collections, collectionId, itemId, fieldArg) {
    var fieldId = fieldArg.path
    var model = collections[collectionId].model
    var inputValues = options.map(() => observable(false))
    var $editing = observable(false)
    var save = new Command(() => {
      return model.patch(itemId, {[fieldId]: serializeInput(inputValues, options, format)}).then($editing.bind(null, false)
      )
    })
    var startEditing = function (itemFieldValue) {
      transaction(function () {
        $editing(true)
        inputValues.forEach((obs, i) => obs(isOptionSelected(itemFieldValue, options[i], format)))
      })
    }

    return observer(function () {
      var editing = $editing()
      var itemFieldValue = model.get(itemId).value[fieldId] || []
      return el('div', null,
        el('div', null, options.map((o,i) => {
          var value = editing ?
            inputValues[i]() :
            isOptionSelected(itemFieldValue, options[i], format)
          return el(Input, {key: i, type: 'checkbox',  label: o[1], checked: value, onChange: ev => {
            if (!editing) startEditing(itemFieldValue)
            inputValues[i](ev.target.checked)
          }})
        })),
        editing || save.status() !== 'idle' ?
          el(Button, {
            key: 'save',
            onClick: save.trigger,
            disabled: save.status() !== 'idle',
          }, save.status() === 'idle' ? 'enregistrer' : save.status('fr')):
          null,
        editing ? el(Button, {key: 'cancel', onClick: $editing.bind(null, false)}, "Annuler") : null
      )
    })
  }
}

function isOptionSelected(itemValue, option, format) {
  return format === 'object' ?
    itemValue[option[0]] :
    itemValue.indexOf(option[0]) >= 0
}

function serializeInput(inputValues, options, format) {
  var selectedOptions = options.filter((o,i) => inputValues[i]()).map(o => o[0])
  if (format === 'object') {
    var out = {}
    selectedOptions.forEach(o => out[o] = true)
    return out
  }
  return selectedOptions
}