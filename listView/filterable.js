import React from 'react'
const el = React.createElement
import create from 'lodash/create'
import { observable} from 'mobservable'
import { observer } from 'mobservable-react'
import Input from 'react-bootstrap/lib/Input'
import Accordion from 'react-semantify/lib/modules/accordion'
import Icon from 'react-semantify/lib/elements/icon'
import filteredCollection from '../collections/dynamicFiltered'

const booleanOptions = [
  ['', "tout"],
  ['$true', "oui"],
  ['$false', "non"],
]

export default function ({view, filters}) {
  return function (collections, collection, $itemId) {
    var model = typeof collection === 'string' ? collections[collection].model : collection
    const collectionId = collection.name || collection
    var filterValues = filters.map(f => observable(f.default != null ? f.default : ''))
    var filterCmps = filters.map((f, i) => {
      if (typeof f.view === 'function') {
        return f.view(collections, collection, filterValues, i)
      }
    })

    var virtualCollectionId = collectionId+'/'+Date.now()
    var virtualCollection = {
      model: filteredCollection(model, () => {
        var filter = {}
        filters.forEach(appendFilter.bind(null, filter, filterValues))
      }),
    }
    var augmentedCollections = create(collections, {[virtualCollectionId]: virtualCollection})
    var listView = view(augmentedCollections, virtualCollectionId, $itemId)

    return observer(function () {
      return el('div', null,
        el(Accordion, { init: true },
          el('div', { className: 'title' },
            el(Icon, { className: 'dropdown' }),
            "Filtrer la liste"
          ),
          el('form', {className: "content form-horizontal"}, filters.map((f, i) => {
            if (typeof f.view === 'function') {
              return el(filterCmps[i])
            }
            var inputType = getInputType(f)
            var options = null
            if (inputType === 'select') {
              const allLabel = f.type.allLabel || "Tout"
              options = f.type === 'boolean' ? booleanOptions : [['', allLabel]].concat(f.type.options)
            }
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

function appendFilter(filter, filterValues, f, i) {
  if (typeof f.toQuery === 'function') return f.toQuery(filter, filterValues, f, i)
  if (filterValues[i]() === '') return
  if (!f.type || f.type === 'text') return filter[f.path] = f.operator ? {[f.operator]: filterValues[i]()} : {$regex: filterValues[i](), $options: 'i'}
  if (f.type === 'boolean') return filter[f.path] = (filterValues[i]() === '$true' ? true : {$ne: true})
  if (f.type.type  === 'select') return filter[f.path] = filterValues[i]()
  if (f.type === 'date') return filter[f.path] = {[f.operator || '$eq']: filterValues[i]()}
  if (f.type === 'json') {
    try {
      var val = JSON.parse(filterValues[i]())
      return filter[f.path] = {[f.operator]: val}
    } catch (err) {
      return filter
    }
  }
}


function getInputType(f) {
  if (!f.type || f.type === 'text') return 'text'
  if (f.type === 'boolean') return 'select'
  if (typeof f.type === 'string') return f.type
  return f.type.type
}

/*TODO:
- permettre d'ajouter/enlever explicitement les filtres (plutôt que par la valeur '' ou null)
- permettre de choisir d'avoir plusieurs options (plutôt que juste une valeur par filtre) ex: permettre à l'utilisateur de choisir le comparateur ou les options de regex
- permettre de customiser l'action du filtre sur la requête
*/
