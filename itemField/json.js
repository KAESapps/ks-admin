import React from 'react'
const el = React.createElement
import { observer } from 'mobservable-react'
import { observable} from 'mobservable'
import Command from '../reactiveCollection/Command'
import Input from 'react-bootstrap/lib/Input'
import Button from 'react-bootstrap/lib/Button'


export default function (collections, collectionId, itemId, fieldArg) {
  var fieldId = fieldArg.path
  var model = collections[collectionId].model
  var $inputValue = observable(null)
  var $editing = observable(false)
  var save = new Command(() => {
    return model.patch(itemId, {[fieldId]: JSON.parse($inputValue())}).then($editing.bind(null, false))
  })
  return observer(function () {
    var editing = $editing()
    var value = editing ?
      $inputValue() :
      JSON.stringify(model.get(itemId).value[fieldId])
    return el('div', {},
      el(Input, {
        type: 'textarea',
        value: value,
        onChange: ev => {
          if (!editing) $editing(true)
          $inputValue(ev.target.value)
        },
      }),
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
