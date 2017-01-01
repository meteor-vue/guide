import Vue from 'vue';

Meteor.startup(() => {
  new Vue({
    el: 'body',
    replace: false
  });
});
