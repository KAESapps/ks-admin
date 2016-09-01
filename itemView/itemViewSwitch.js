import { createElement as el } from 'react'
import { observer } from 'mobservable-react'

export default ({ itemView }) => {
  return (collections, collection, $itemId) => {
    return observer(function() {
      if ($itemId()) {
        return el(itemView(collections, collection, $itemId()))
      } else {
        return null
      }
    })
  }
}
