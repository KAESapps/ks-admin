import React from 'react'
const el = React.createElement
import { observer } from 'mobservable-react'

import multiSelect from './multiSelect'

export default function (arg) {
  var optionsCollectionId = arg.collection
  return function (collections, itemsCollectionId, itemId, fieldArg) {
    var optionsModel = collections[optionsCollectionId].model

    return observer(function () {
      var options = optionsModel.query()
      var createCmp
      if (!options.loaded) {
        createCmp = multiSelect({options: [], format: arg.format})
      } else {
        createCmp = multiSelect({options: options.value.map(optionId => {
          var option = optionsModel.get(optionId)
          return [optionId, option.loaded ? option.value[arg.labelPath] || optionId : optionId]
        }), format: arg.format})
      }
      return el(createCmp(collections, itemsCollectionId, itemId, fieldArg))
    })
  }
}