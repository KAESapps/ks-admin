import moment from 'moment'
import React from 'react'
const el = React.createElement
import { observer } from 'mobservable-react'
import { observable} from 'mobservable'
import Command from '../reactiveCollection/Command'

import Input from 'react-bootstrap/lib/Input'
import Button from 'react-bootstrap/lib/Button'

// from null or period as string to number of days as string
function transformValue(value) {
  if (!value) return ''
  return moment.duration(value).asDays()
}

function transformEvent(ev) {
  return ev.target.valueAsNumber
}

function revertValue(days) {
  return moment.duration(days, 'days').toJSON()
}


export var input = function ({value, onChange}) {
  return el(Input, {
    type: 'number',
    value: transformValue(value),
    onChange: ev => onChange(revertValue(transformEvent(ev))),
  })
}

// TODO: faire un vrai rendu de période avec un champ pour année, mois, jour, ...

export default function (collections, collectionId, itemId, fieldArg) {
  var fieldId = fieldArg.path
  var model = collections[collectionId].model
  var $inputValue = observable(null)
  var $editing = observable(false)
  var save = new Command(() => {
    return model.patch(itemId, {[fieldId]: revertValue($inputValue())}).then($editing.bind(null, false))
  })
  var onChange = newVal => {
    if (!$editing()) $editing(true)
    $inputValue(newVal)
  }

  return observer(function () {
    var editing = $editing()
    var value = editing ?
      $inputValue() :
      transformValue(model.get(itemId).value[fieldId])
    return el('div', null,
      el(input, {value, onChange}),
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

