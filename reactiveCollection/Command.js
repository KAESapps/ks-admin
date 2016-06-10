import { observable, asReference, transaction } from 'mobservable'

var locales = {
  fr: {
    'idle': "inactif",
    'inProgress': "en cours...",
    'success': "ok",
    'error': "erreur !",
  },
  en: {
    'idle': "idle",
    'inProgress': "in progress...",
    'success': "success",
    'error': "error !",
  },
}

export default class Command {
  constructor (action) {
    var $status = this._status = observable('idle')
    var $detail = this._detail = observable(asReference(null))
    this._view = observable(() => $status())
    // on ne le met pas sur le prototype pour éviter de devoir le binder à this
    var setStatus = (status, detail = null) => {
      transaction(()=>{
        $status(status)
        $detail(detail)
      })
    }

    this.trigger = function() {
      setStatus('inProgress')
      return action.apply(null, arguments).then((res) => {
        setStatus('success', res)
        setTimeout(()=>{
          setStatus('idle')
        }, 2000)
        return res
      }, (err) => {
        setStatus('error', err)
        setTimeout(()=>{
          setStatus('idle')
        }, 2000)
        throw err
      })
    }
  }


  onBecomeUnobserved (cb) {
    return this._view.$mobservable.onceSleep(cb)
  }
  status (locale) {
    return locale ? locales[locale][this._view()]: this._view()
  }
  statusDetail() {
    return this._detail()
  }
}
