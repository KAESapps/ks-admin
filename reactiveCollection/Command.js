import { observable } from 'mobservable'

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

export default class Atom {
  constructor (action) {
    var status = this._status = observable('idle')
    this._view = observable(() => status())
    // on ne le met pas sur le prototype pour éviter de devoir le binder à this
    this.trigger = function() {
      status('inProgress')
      return action.apply(null, arguments).then(function (res) {
        status('success')
        setTimeout(()=>status('idle'), 2000)
        return res
      }, function (err) {
        status('error')
        setTimeout(()=>status('idle'), 2000)
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
}
