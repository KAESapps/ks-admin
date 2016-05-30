import React from 'react'
const el = React.createElement
import create from 'lodash/create'
import assign from 'lodash/assign'
import { observable} from 'mobservable'
import { observer } from 'mobservable-react'
import Input from 'react-bootstrap/lib/Input'
import Accordion from 'react-semantify/lib/modules/accordion'
import Icon from 'react-semantify/lib/elements/icon'
import filteredCollection from '../collections/filtered'

const booleanOptions = [
  ['', "tout"],
  ['$true', "oui"],
  ['$false', "non"],
]

export default function ({view, filters}) {
  return function (collections, collectionId, $itemId) {
    var model = collections[collectionId].model
    var filterValues = filters.map(f => observable(f.default != null ? f.default : ''))

    return observer(function () {
      var filter = {}
      filters.forEach(appendFilter.bind(null, filter, filterValues))
      var virtualCollectionId = collectionId+'/'+JSON.stringify(filter) // pratique pour du débug
      var virtualCollection = {
        model: filteredCollection(model, filter),
      }
      var augmentedCollections = create(collections, {[virtualCollectionId]: virtualCollection})
      var listView = view(augmentedCollections, virtualCollectionId, $itemId)

      return el('div', null,
        el(Accordion, { init: true },
          el('div', { className: 'title' },
            el(Icon, { className: 'dropdown' }),
            "Filtrer la liste"
          ),
          el('form', {className: "content form-horizontal"}, filters.map((f, i) => {
            var inputType = getInputType(f)
            var options = null
            if (inputType === 'select')  options = f.type === 'boolean' ? booleanOptions : [['', "tout"]].concat(f.type.options)
            return el(Input, {key: i, label: f.label, labelClassName: "col-xs-2", wrapperClassName: "col-xs-10"},
              el(Input, {type: inputType, value: filterValues[i](), onChange: ev => filterValues[i](ev.target.value)},
                options && options.map((o, i) => el('option', {key: i, value: o[0]}, o[1]))
              )
            )
          }))
        ),
        el(listView)
      )
    })
  }
}

function getInputType(f) {
  if (!f.type || f.type === 'text') return 'text'
  if (f.type === 'boolean') return 'select'
  if (typeof f.type === 'string') return f.type
  return f.type.type
}
function appendFilter(filter, filterValues, f, i) {
  if (filterValues[i]() === '') return
  if (!f.type || f.type === 'text') return filter[f.path] = f.operator ? {[f.operator]: filterValues[i]()} : {$regex: filterValues[i](), $options: 'i'}
  if (f.type === 'boolean') return filter[f.path] = (filterValues[i]() === '$true' ? true : {$ne: true})
  if (f.type.type  === 'select') return filter[f.path] = filterValues[i]()
  if (f.type === 'date') return filter[f.path] = {[f.operator || '$eq']: filterValues[i]()}
}

/*TODO:
- permettre d'ajouter/enlever explicitement les filtres (plutôt que par la valeur '' ou null)
- permettre de choisir d'avoir plusieurs options (plutôt que juste une valeur par filtre) ex: permettre à l'utilisateur de choisir le comparateur ou les options de regex
- permettre de customiser l'action du filtre sur la requête
*/
