import get from 'lodash/get'
import React from 'react'
const el = React.createElement
import { observer } from 'mobservable-react'
import { observable} from 'mobservable'
import Command from '../reactiveCollection/Command'

import Input from 'react-bootstrap/lib/Input'
import Button from 'react-bootstrap/lib/Button'

var fromValue = value => value ? '$true' : '$false'
var fromEvent = ev => ev.target.value === '$true' ? true : false

export var input = function({value, onChange}) {
  return el(Input, {
    key: 'input',
    type: 'select',
    value: fromValue(value),
    onChange: ev => onChange(fromEvent(ev)),
  },
    el('option', {value: '$true'}, "oui"),
    el('option', {value: '$false'}, "non")
  )
}

export default function (collections, collectionId, itemId, fieldArg) {
  var fieldId = fieldArg.path
  var model = collections[collectionId].model
  var $inputValue = observable(null)
  var $editing = observable(false)
  var save = new Command(() => {
    return model.patch(itemId, {[fieldId]: $inputValue()}).then($editing.bind(null, false))
  })

  return observer(function () {
    var editing = $editing()
    var value = normalizeValue(editing ?
      $inputValue() :
      get(model.get(itemId).value, fieldId)
    )
    return el('div', null,
      el(Input, {
        key: 'input',
        type: 'select',
        value: value,
        onChange: ev => {
          if (!editing) $editing(true)
          $inputValue(normalizeEvent(ev))
        },
      },
        el('option', {value: '$true'}, "oui"),
        el('option', {value: '$false'}, "non")
      ),
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


function normalizeValue(value) {
  return value ? '$true' : '$false'
}

function normalizeEvent(ev) {
  return ev.target.value === '$true' ? true : false
}
