export default function(wrapReactView) {
  return function(ctxView) {
    return function(ctx) {
      return wrapReactView(ctxView(ctx))
    }
  }
}
