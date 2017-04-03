import get from 'lodash/get'
import React from 'react'
const el = React.createElement
import { observer } from 'mobservable-react'
import { map, asReference, observable } from 'mobservable'
import Command from '../reactiveCollection/Command'

import debounce from 'lodash/debounce'

const preventDefault = ev => ev.preventDefault()

const numberEditor = ({model, path, itemId, $patch}) => {
  const numberValueAsText = observable(null)
  return {
    setValue: newVal => {
      numberValueAsText(newVal)
      newVal = parseFloat(newVal)
      $patch.set(path, isNaN(newVal) ? null : newVal)
    },
    getValue: observable(() => {
      var itemValue = model.get(itemId).value
      var partEditing = $patch.has(path)
      var numberValueOrNull = partEditing ? $patch.get(path) : get(itemValue, path)
      if (isNaN(numberValueOrNull) || numberValueOrNull == null) return ''
      return parseFloat(numberValueAsText()) === numberValueOrNull ? numberValueAsText() : numberValueOrNull+''
    }),
  }
}

const textEditor = ({model, path, itemId, $patch}) => ({
  setValue: newVal => {
    $patch.set(path, newVal)
  },
  getValue: observable(() => {
    var itemValue = model.get(itemId).value
    var partEditing = $patch.has(path)
    return partEditing ? $patch.get(path) : get(itemValue, path)
  }),
})

export var fieldEditor = function(collections, collectionId, itemId, $patch, options) {
  var model = collections[collectionId].model
  var path = options.path
  var type = options.type || 'text'

  const { setValue: onChange, getValue } = (type === 'number' ? numberEditor : textEditor)({model, path, itemId, $patch})

  return observer(function() {
    const value = getValue()

    if (typeof type === 'function') return el(type, {value, onChange})
    return el(type === 'textarea' ? 'textarea' : 'input', {
      className: 'ui input',
      type: type === 'number' ? 'tel' : type,
      value: value || "",
      onChange: ev => onChange(ev.target.value),
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
    return el('div', { className: 'field' },
      el('label', {}, label),
      el(cmp),
      el('p', {}, options.help)
    )
  }
}

export const partFactory = function(collections, collectionId, itemId, $patch) {
  return function(part) {
    if (typeof part === 'function') return part(collections, collectionId, itemId, $patch)
    if (typeof part === 'string') part = {path: part, label: part, type: 'text'}
    if (Array.isArray(part)) part = {path: part[0], label: part[1], type: 'text'}
    return labeledPart(collections, collectionId, itemId, $patch, part)
  }
}

export default function (opts, parts) {
  if (arguments.length < 2) {
    parts = opts
    opts = { autoSave: false }
  }

  return function (collections, collectionId, itemId) {
    var model = collections[collectionId].model
    var $patch = map({}, asReference)
    var save = new Command(() => {
      return model.patch(itemId, $patch.toJs()).then(() => $patch.clear())
    })
    var cmps = parts.map(partFactory(collections, collectionId, itemId, $patch))

    if (opts.autoSave) {
      $patch.observe(debounce(save.trigger, 500))
    }

    return observer(function () {
      var editing = $patch.keys().length > 0

      return el('div', { className: 'ui form'},
        el('form', {onSubmit: preventDefault}, cmps.map((cmp, i) => el(cmp, {key: i}))),
        el('div', { className: 'ui hidden divider'}),
        editing && save.status() === 'idle' ? el('button', {
          className: 'ui primary button',
          onClick: save.trigger,
          // disabled: !editing || save.status() !== 'idle',
        }, 'Enregistrer') : null,
        save.status() === 'inProgress' ? el('button', {
          className: 'ui primary loading button',
        }, 'Enregistrer') : null,
        save.status() === 'success' ? el('button', {
          className: 'ui positive button',
          disabled: true,
        }, 'Enregistré') : null,
        !opts.autoSave && editing && save.status() === 'idle' ? el('button', {
          // disabled: !editing || save.status() !== 'idle',
          className: 'ui button',
          onClick: () => $patch.clear(),
        }, "Annuler") : null,
        save.status() === 'error' ? el('div', { className: 'ui negative message' }, save.status('fr')) : null
      )
    })
  }
}
