import React from 'react'
const el = React.createElement
import { observer } from 'mobservable-react'
import Input from 'react-bootstrap/lib/Input'
import Command from '../reactiveCollection/Command'


const processFile = function(arg) {
  var label = typeof arg === 'function' ? "" : arg.label
  var processFileFn = typeof arg === 'function' ? arg : arg.processFile
  var cmd = new Command(processFileFn)

  var onFileChanged = ev => {
    ev.target.files[0] && cmd.trigger(ev.target.files[0])
    ev.target.value = null
  }

  return observer(function () {
    var status = cmd.status()
    return el('div', null,
      el(Input, {
        type: 'file',
        label: label,
        onChange: onFileChanged,
        disabled: status !== 'idle',
      }),
      el('span', null, status === 'idle' ? '' : status)
    )
  })
}

export const processTextFile = arg => {
  var userProcessFileFn = typeof arg === 'function' ? arg : arg.processFile
  var processFileFn = file => new Promise((resolve, reject) => {
    var reader = new FileReader()
    reader.onload = function (e) {
      resolve({name: file.name, size: file.size, type: file.type, content: e.target.result})
    }
    reader.onerror = reject

    reader.readAsText(file)
  })
  .then(userProcessFileFn)

  return processFile({label: arg.label, processFile: processFileFn})
}

export default processFile
