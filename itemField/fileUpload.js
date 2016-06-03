import React from 'react'
const el = React.createElement
import { observer } from 'mobservable-react'
import Input from 'react-bootstrap/lib/Input'
import Command from '../reactiveCollection/Command'

export default function(uploadFile) {
  return function (collections, collectionId, itemId, fieldArg) {
    var fieldPath = fieldArg.path
    var model = collections[collectionId].model
    var cmd = new Command(file =>
      uploadFile(file)
      .then(url =>
        model.patch(itemId, {[fieldPath]: url})
      )
    )
    var onFileChanged = ev => {
      ev.target.files[0] && cmd.trigger(ev.target.files[0])
      ev.target.value = null
    }

    return observer(function () {
      var status = cmd.status()
      return el('div', null, [
        el(Input, {
          key: 'action',
          type: 'file',
          label: "Ajouter depuis le disque dur",
          onChange: onFileChanged,
          disabled: status !== 'idle',
        }),
        el('span', {key: 'status'}, status === 'idle' ? '' : status),
      ])
    })
  }

}
