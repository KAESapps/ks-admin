import React from 'react'
const el = React.createElement
import { observer } from 'mobservable-react'
import { observable} from 'mobservable'
import Command from '../reactiveCollection/Command'

import Input from 'react-bootstrap/lib/Input'
import Button from 'react-bootstrap/lib/Button'

export var input = function (options) {
  return function ({value, onChange}) {
    return el('div', null, options.map(o =>
      el(Input, {
        key: o[0],
        type: 'radio',
        label: o[1],
        checked: value === o[0],
        onChange: ev => onChange(o[0]),
      })
    ))
  }
}

export default function (options) {
  return function (collections, collectionId, itemId, fieldArg) {
    var fieldId = fieldArg.path
    var model = collections[collectionId].model
    var $inputValue = observable(null)
    var $editing = observable(false)
    var save = new Command(() => {
      return model.patch(itemId, {[fieldId]: $inputValue()}).then($editing.bind(null, false))
    })
    var onChange = newVal => {
      if (!$editing()) $editing(true)
      $inputValue(newVal)
    }
    var inputCmp = input(options)

    return observer(function () {
      var editing = $editing()
      var value = editing ?
        $inputValue() :
        model.get(itemId).value[fieldId]
      return el('div', null,
        inputCmp({value, onChange}),
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