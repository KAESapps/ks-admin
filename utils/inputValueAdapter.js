import { observable } from 'mobservable'

const quietDelay = 1000 // auto submit input value after this delay

export default function({ getValue: getExternalValue, setValue: setExternalValue }) {
  let quietTimeoutId
  const $mode = observable('displaying')
  let shouldDisplayValueOnResponse = false
  const $inputValue = observable(null) // observable de la valeur en cours de saisie par l'utilisateur et qui sera soumise automatiquement après un délai

  const submit = () => {
    quietTimeoutId = null
    const promise = setExternalValue($inputValue())
    if (promise) {
      shouldDisplayValueOnResponse = true
      promise.then(() => {
        if (shouldDisplayValueOnResponse) {
          $mode('displaying')
        }
      })
    } else {
      $mode('displaying')
    }
  }

  const setValue = inputValue => {
    $inputValue(inputValue)
    if ($mode() !== 'editing') $mode('editing')
    if (shouldDisplayValueOnResponse) { shouldDisplayValueOnResponse = false }
    if (quietTimeoutId) clearTimeout(quietTimeoutId)
    quietTimeoutId = setTimeout(submit, quietDelay)
  }
  const getValue = () => {
    const externalValue = getExternalValue()
    // si l'utilisateur a recommencé à saisir pendant le temps de la soumission, on ne repasse pas en mode affichage (et donc on ne perturbe pas sa saisie)
    if (shouldDisplayValueOnResponse) {
      setTimeout(() => $mode('displaying'))
      shouldDisplayValueOnResponse = false
    }
    return $mode() === 'displaying' ? externalValue || '' : $inputValue()
  }

  return { getValue, setValue }
}
