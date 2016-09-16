import React from 'react'
const el = React.createElement
import { observer } from 'mobservable-react'

import multiSelect from './multiSelect'

export default function ({collection, labelPath, format}) {
  return function (collections, itemsCollectionId, itemId, $patch, fieldArg) {
    var optionsModel = typeof collection === 'string' ? collections[collection].model : collection

    return observer(function () {
      var options = optionsModel.query()
      var createCmp
      if (!options.loaded) {
        createCmp = multiSelect({options: [], format: format})
      } else {
        createCmp = multiSelect({options: options.value.map(optionId => {
          var option = optionsModel.get(optionId)
          return [optionId, option.loaded ? option.value[labelPath] || optionId : optionId]
        }), format: format})
      }
      return el(createCmp(collections, itemsCollectionId, itemId, $patch, fieldArg))
    })
  }
}