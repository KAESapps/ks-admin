import { autorun } from 'mobservable'

import Atom from './Atom'

var item = new Atom({loaded: false, value: {}})
item.onBecomeUnobserved(() => {
  console.log('no more listeners')
})

var disposer = autorun(() => console.log(item.getValue(), item.getValue().value && item.getValue().value.name))

setTimeout(() => item.setValue({loaded: true, value: {'name': 'toto'}}), 100)
setTimeout(() => item.setValue({loaded: true, value: {'name': 'titi'}}), 200)
setTimeout(() => item.patchValue({loading: false}), 250)
setTimeout(disposer, 500)
