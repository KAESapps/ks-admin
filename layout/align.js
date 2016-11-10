const el = require('react').createElement
import fitConvention from './fitConvention'
const assign = require('lodash/assign')

const reactVCenter = function(reactView) {
  return function() {
    return el('div', {
      style: assign({
        alignItems: 'center',
      }, fitConvention.parent),
    }, el(reactView))
  }
}

const alignments = {
  right: 'flex-end',
  left: 'flex-start',
  center: 'center',
}
export const reactHAlign = function(align) {
  return function(reactView) {
    return function() {
      return el('div', {
        style: assign({
          justifyContent: alignments[align],
        }, fitConvention.child, fitConvention.parent),
      }, el(reactView))
    }
  }
}

const ctxViewWrapper = function(wrapReactView) {
  return function(ctxView) {
    return function(ctx) {
      return wrapReactView(ctxView(ctx))
    }
  }
}

export const vCenter = ctxViewWrapper(reactVCenter)
export const hAlign = function(align) { return ctxViewWrapper(reactHAlign(align)) }
