/*global $*/

import React from 'react'
const el = React.createElement
import { observer } from 'mobservable-react'
import assign from 'lodash/assign'

const SelectMultiple = React.createClass({
  componentDidMount: function () {
    const that = this
    let {value, onChange} = this.props
    this._cmp = $(this.refs.root).dropdown({
      action: 'activate',
      onChange: function(values) {
        // l'appel à setExactly déclenche plusieurs appels à onChange (avec des valeurs partielles)
        // cela permet donc de n'appeler onChange que sur un changement utilisateur
        if (!that._setExactlyInProgress) onChange(values.split(','))
      },
    })
    this._setExactlyInProgress = true
    this._cmp.dropdown('set exactly', value)
    this._setExactlyInProgress = false
  },
  shouldComponentUpdate: function(props){
    // dans ce cas de figure, les props 'options' et 'onChange' ne peuvent pas changer pendant la durée de vie du widget, donc pas besoin d'appeler 'render'
    // par contre, on met à jour la valeur en mutable... ça marche
    this._setExactlyInProgress = true
    this._cmp.dropdown('set exactly', props.value)
    this._setExactlyInProgress = false
    return false
  },
  render: function () {
    let {options} = this.props
    return el('div', { ref: 'root', className: 'ui fluid multiple search selection dropdown' },
      el('input', { type: 'hidden'}),
      el('i', { className: 'dropdown icon' }),
      el('div', { className: 'default text' }, "Sélectionner les hotels"),
      el('div', { className: 'menu' }, options.map((o, i) =>
        el('div', {
          key: i,
          className: 'item',
          'data-value': o[0],
        }, o[1])
      ))
    )

  }
})

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
      var value = editing ? $patch.get(path).toJSON() : itemFieldValue

      return el(SelectMultiple, {value, onChange, options})
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