import { createElement as el } from 'react'
import { observer } from 'mobservable-react'

export default function(command, opts) {
  const { label, onAction = command.trigger, sizeClass = '', typeClass = '' } = opts

  return observer(function() {
    if (command.status() === 'idle') {
      return el('button', {
        className: 'ui button ' + sizeClass + ' ' + typeClass,
        onClick: () => onAction(command),
      }, label || '')
    }
    if (command.status() === 'inProgress') {
      return el('button', {
        className: 'ui primary loading button ' + sizeClass,
      }, label || '')
    }
    if (command.status() === 'success') {
      return el('button', {
        className: 'ui positive button ' + sizeClass,
        disabled: true,
      }, el('i', { className: 'checkmark icon' }))
    }
    if (command.status() === 'error') {
      return el('button', {
        className: 'ui negative button ' + sizeClass,
        disabled: true,
      }, el('i', { className: 'warning circle icon' }))
    }
  })
}
