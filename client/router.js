import Vue from 'vue';
import Router from 'vue-router';

import Home from './home.vue';
import Blaze from './blaze.vue';

Vue.use(Router);

export default new Router({
  routes: [
    { path: '/', name: 'home', component: Home },
    { path: '/blaze', name: 'blaze', component: Blaze },
  ]
});
