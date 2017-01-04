import Vue from 'vue';

Meteor.startup(() => {
  new Vue({
    el: '#app',
    render: (createElement) => {
      return createElement(Vue.component('app'));
    }
  });
});
