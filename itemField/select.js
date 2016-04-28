import React from 'react'
const el = React.createElement
import { observer } from 'mobservable-react'
import { observable} from 'mobservable'
import Command from '../reactiveCollection/Command'

import Input from 'react-bootstrap/lib/Input'
import Button from 'react-bootstrap/lib/Button'


export default function (arg) {
  var multi, options
  if (arg.options) {
    multi = arg.multi || arg.multiple
    options = arg.options
  } else {
    multi = false
    options = arg
  }
  if (!multi) options = [['$null', ""]].concat(options)
  return function (collections, collectionId, itemId, fieldArg) {
    var fieldId = fieldArg.path
    var model = collections[collectionId].model
    var $inputValue = observable(null)
    var $editing = observable(false)
    var save = new Command(() => {
      return model.patch(itemId, {[fieldId]: $inputValue()}).then($editing.bind(null, false))
    })

    return observer(function () {
      var editing = $editing()
      var value = editing ?
        $inputValue() :
        normalizeValue(model.get(itemId).value[fieldId], multi)
      return el('div', null,
        el(Input, {
          key: 'input',
          type: 'select',
          multiple: multi,
          value: value,
          onChange: ev => {
            if (!editing) $editing(true)
            $inputValue(normalizeEvent(ev, multi))
          },
        }, options.map(op => el('option', {key: op[0], value: op[0]}, op[1]))),
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

function normalizeValue(val, multi) {
  return multi ? normalizeMultiValue(val) : normalizeMonoValue(val)
}

function normalizeMultiValue(value) {
  if (value === undefined) return []
  if (value === null) return []
  return Array.isArray(value) ? value: [value]
}
function normalizeMonoValue(value) {
  return !value ? '$null' : value
}

function normalizeEvent(ev, multi) {
  return multi ?
    [...ev.target.selectedOptions].map(opt => opt.value) :
    ev.target.value === '$null' ? null : ev.target.value
}
