import Vue from 'vue';
import {RouterFactory, nativeScrollBehavior} from 'meteor/akryum:vue-router2';

Meteor.startup(() => {
  const router = new RouterFactory({
    mode: 'history',
    scrollBehavior: nativeScrollBehavior,
  }).create();

  new Vue({
    el: '#app',
    router: router,
    render: (createElement) => {
      return createElement(Vue.component('layout'));
    }
  });
});
