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
    var status = this._status = observable('idle')
    this._detail = observable(asReference(null))
    this._view = observable(() => status())
    // on ne le met pas sur le prototype pour éviter de devoir le binder à this
    this.trigger = function() {
      this.setStatus('inProgress')
      return action.apply(null, arguments).then(function (res) {
        this.setStatus('success', res)
        setTimeout(()=>{
          this.setStatus('idle')
        }, 2000)
        return res
      }, (err) => {
        this.setStatus('error', err)
        setTimeout(()=>{
          this.setStatus('idle')
        }, 2000)
        throw err
      })
    }
  }

  setStatus(status, detail = null) {
    transaction(()=>{
      this._status(status)
      this._detail(detail)
    })
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
