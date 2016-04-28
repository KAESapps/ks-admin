import { observable, asReference } from 'mobservable'

export default class Atom {
  constructor (initValue) {
    var obs = this._obs = observable(asReference(initValue))
    this._view = observable(() => obs())
  }
  onBecomeUnobserved (cb) {
    return this._view.$mobservable.onceSleep(cb)
  }
  getValue () {
    return this._view()
  }
  setValue (val) {
    this._obs(val)
  }
  patchValue (patch) { // only first level
    this._obs(Object.assign({}, this._obs(), patch))
  }
}
