import React from 'react'
const el = React.createElement
import { observer } from 'mobservable-react'
import Command from '../reactiveCollection/Command'
import commandButton from './commandButton'

const filePicker = function(arg) {
  if (typeof arg === 'function') {
    arg = {
      processFile: arg,
    }
  }
  // arg is always an object from here
  let { view = "Choisir un fichier", processFile } = arg

  var cmd = new Command(processFile)

  if (typeof view === 'string') {
    const label = view
    view = function(pickFile, command) {
      return commandButton(command, { label, onAction: pickFile })
    }
  }

  var onFileChanged = ev => {
    ev.target.files[0] && cmd.trigger(ev.target.files[0])
    ev.target.value = null
  }

  let fileInputNode
  const View = view(function() {
    fileInputNode.click()
  }, cmd)

  return observer(class extends React.Component {
    render() {
      return el('div', null,
        el('input', {
          ref: (node) => { fileInputNode = node },
          type: 'file',
          style: { display: 'none' },
          onChange: onFileChanged,
        }),
        el(View)
      )
    }
  })
}

export const textFilePicker = arg => {
  var userProcessFileFn = typeof arg === 'function' ? arg : arg.processFile
  var processFile = file => new Promise((resolve, reject) => {
    var reader = new FileReader()
    reader.onload = function (e) {
      resolve({name: file.name, size: file.size, type: file.type, content: e.target.result})
    }
    reader.onerror = reject

    reader.readAsText(file)
  })
  .then(userProcessFileFn)

  return filePicker({view: arg.view, processFile})
}

export default filePicker
