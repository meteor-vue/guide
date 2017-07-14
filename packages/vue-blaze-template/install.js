import BlazeTemplate from './blaze-template';

export function install (Vue) {
  Vue.component('blaze-template', BlazeTemplate)

  if (Package['akryum:vue-router'] || Package['akryum:vue-router2']) {
    import './router-link';
  }
}
