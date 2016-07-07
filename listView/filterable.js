import React from 'react'
const el = React.createElement
import create from 'lodash/create'
import { observable} from 'mobservable'
import { observer } from 'mobservable-react'
import Accordion from 'react-semantify/lib/modules/accordion'
import Icon from 'react-semantify/lib/elements/icon'
import filteredCollection from '../collections/dynamicFiltered'
import defaults from 'lodash/defaults'
import identity from 'lodash/identity'

const booleanOptions = [
  ['', "tout"],
  ['$true', "oui"],
  ['$false', "non"],
]

export default function ({view, filters, collapsable=true}) {
  return function (collections, collection, $itemId) {
    var model = typeof collection === 'string' ? collections[collection].model : collection
    const collectionId = collection.name || collection

    var defaultFilterValue = {}
    filters.forEach(f => {
      if (f.path) {
        defaultFilterValue[f.path] = f.default || ''
      }
    })
    const filtersState = observable(defaultFilterValue)

    var filterCmps = filters.map((f) => {
      if (typeof f.view === 'function') {
        return f.view(collections, collection, filtersState, f)
      }
    })

    var virtualCollectionId = collectionId + '/' + Date.now()
    var virtualCollection = {
      model: filteredCollection(model, () => {
        var queryFilter = {}
        filters.forEach(appendFilter.bind(null, queryFilter, filtersState))
        return queryFilter
      }),
    }
    var augmentedCollections = create(collections, {[virtualCollectionId]: virtualCollection})
    var listView = view(augmentedCollections, virtualCollectionId, $itemId)

    return observer(function () {
      let filterView = el('div', {className: "content ui form"}, filters.map((f, i) => {
        let widget
        if (typeof f.view === 'function') {
          widget = el(filterCmps[i], { key: i })
        } else {
          var inputType = getInputType(f)
          var options = null
          if (inputType === 'select') {
            const allLabel = f.type.allLabel || "Tout"
            options = f.type === 'boolean' ? booleanOptions : [['', allLabel]].concat(f.type.options)
          }
          const filterValue = filtersState[f.path]

          widget = el(inputType === 'select' ? 'select' : 'input', {
            type: inputType,
            value: filterValue,
            onChange: ev => filtersState[f.path] = ev.target.value
          },
            options && options.map((o, i) => el('option', {key: i, value: o[0]}, o[1]))
          )
        }

        return el('div', { key: i, className: "inline field" },
          el('label', {}, f.label),
          widget
        )
      }))

      if (collapsable) {
        filterView = el(Accordion, { init: true },
          el('div', { className: 'title' },
            el(Icon, { className: 'dropdown' }),
            "Filtrer la liste"
          ),
          filterView
        )
      }

      return el('div', null,
        filterView,
        el('div', { className: 'ui divider' }),
        el(listView)
      )
    })
  }
}

function appendFilter(queryFilter, filtersState, f) {
  if (typeof f.toQuery === 'function') return f.toQuery(queryFilter, filtersState, f)

  if (!f.path) return

  f = defaults(f, {
    mapValue: identity,
    type: 'text',
  })

  let filterValue = filtersState[f.path]
  if (filterValue === '') return

  filterValue = f.mapValue(filterValue)

  if (!f.type || f.type === 'text') return queryFilter[f.path] = f.operator ? {[f.operator]: filterValue} : {$regex: filterValue, $options: 'i'}
  if (f.type === 'boolean') return queryFilter[f.path] = (filterValue === '$true' ? true : {$ne: true})
  if (f.type.type  === 'select') return queryFilter[f.path] = filterValue
  if (f.type === 'date') return queryFilter[f.path] = {[f.operator || '$eq']: filterValue}
  if (f.type === 'json') {
    try {
      var val = JSON.parse(filterValue)
      return queryFilter[f.path] = {[f.operator]: val}
    } catch (err) {
      return queryFilter
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
*/
