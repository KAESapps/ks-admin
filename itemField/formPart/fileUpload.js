import { fileUploadWidget } from '../fileUpload'

export default function(uploadFile) {
  return function(collections, collectionId, itemId, $patch, options) {
    var path = options.path
    var onChange = (newVal) => $patch.set(path, newVal)

    return fileUploadWidget({ uploadFile, onChange })
  }
}
