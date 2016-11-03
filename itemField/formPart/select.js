import React from 'react'
const el = React.createElement
import findIndex from 'lodash/findIndex'

export const selectInput = function ({ options, multiple = false, nullLabel="" }) {
  if (!multiple) options = [[null, nullLabel]].concat(options)
  return function ({ value, onChange }) {
    return el('select', {
      multiple,
      value: normalizeValue(value, options, multiple),
      onChange: (ev) => onChange(normalizeEvent(ev, options, multiple)),
    }, options.map((op, i) => el('option', { key: i, value: i }, op[1])))
  }
}

export default function(arg) {
  let { options, multiple } = arg
  if (!options) {
    options = arg
  }
  return selectInput({
    options,
    multiple,
  })
}

function indexFromValue(value, options) {
  return findIndex(options, (option) => option[0] === value)
}

function valueFromIndex(index, options) {
  return options[index][0]
}

function normalizeValue(val, options, multiple) {
  return multiple ? normalizeMultiValue(val, options) : normalizeMonoValue(val, options)
}

function normalizeMultiValue(value, options) {
  if (value === undefined) return []
  if (value === null) return []
  return Array.isArray(value) ? value.map(v => indexFromValue(v, options)) : [value]
}
function normalizeMonoValue(value, options) {
  return indexFromValue((value === undefined) ? null : value, options)
}

function normalizeEvent(ev, options, multiple) {
  return multiple ?
    [...ev.target.selectedOptions].map(opt => valueFromIndex(opt.value, options)) :
    valueFromIndex(ev.target.value, options)
}
