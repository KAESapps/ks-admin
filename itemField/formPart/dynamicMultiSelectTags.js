import {get} from 'lodash'
import React from 'react'
const el = React.createElement
import { observable } from 'mobservable'
import { observer } from 'mobservable-react'

import Select from 'react-select'

export default function (arg) {
  var optionsCollectionId = arg.collection

  return function (collections, itemsCollectionId, itemId, $patch, fieldArg) {
    var optionsModel = collections[optionsCollectionId].model
    var path = fieldArg.path
    var itemsModel = collections[itemsCollectionId].model
    var onChange = values =>
      $patch.set(path, values.map(v => v.value))
    const $search = observable(null)
    var onInputChange = input => {
      console.log('requested options', input)
      $search(input)
    }

    return observer(function () {
      var editing = $patch.has(path)
      var itemFieldValue = itemsModel.get(itemId).value[path] || []
      var value = editing ? $patch.get(path).toJSON() : itemFieldValue
      var search = $search()
      var searchResults = search ? optionsModel.query({
        _id: JSON.stringify({$nin: value}),
        [arg.labelPath]: JSON.stringify({$regex: search, $options: 'i'}),
        $limit: 5,
        $sort: JSON.stringify({[arg.labelPath]: 1}),
      }) : null
      var isLoading = searchResults && !searchResults.loaded
      var options = value.concat(searchResults && searchResults.loaded ?
        searchResults.value : []
      ).map(optionId => {
        var option = optionsModel.get(optionId)
        if (option.loaded) return {value: optionId, label: get(option.value, arg.labelPath)}
        return {value: optionId, label: optionId}
      })

      return el(Select, {
        multi: true,
        joinValues: true,
        value,
        onChange,
        options,
        onInputChange,
        isLoading,
        filterOption: (options) => options,
      })
    })
  }
}