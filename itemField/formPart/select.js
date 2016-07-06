import React from 'react'
const el = React.createElement

const selectInput = function ({ options, multiple = false }) {
  if (!multiple) options = [['$null', ""]].concat(options)
  return function ({ value, onChange }) {
    return el('select', {
      multiple,
      value: normalizeValue(value, multiple),
      onChange: (ev) => onChange(normalizeEvent(ev, multiple)),
    }, options.map(op => el('option', {key: op[0], value: op[0]}, op[1])))
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

function normalizeValue(val, multiple) {
  return multiple ? normalizeMultiValue(val) : normalizeMonoValue(val)
}

function normalizeMultiValue(value) {
  if (value === undefined) return []
  if (value === null) return []
  return Array.isArray(value) ? value: [value]
}
function normalizeMonoValue(value) {
  return !value ? '$null' : value
}

function normalizeEvent(ev, multiple) {
  return multiple ?
    [...ev.target.selectedOptions].map(opt => opt.value) :
    ev.target.value === '$null' ? null : ev.target.value
}
