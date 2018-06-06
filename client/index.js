import Vue from 'vue';

import Layout from './layout';
import router from './router';

import './index.html';

Vue.config.productionTip = false;

Meteor.startup(() => {
  new Vue({
    router,
    render: (h) => h(Layout),
  }).$mount('#app');
});
