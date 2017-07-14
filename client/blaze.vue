<template>
  <div v-blaze="'blaze-template'"></div>
</template>

<script>
  import Vue from 'vue';
  import {RouterFactory} from 'meteor/akryum:vue-router2';

  RouterFactory.configure((factory) => {
    factory.addRoutes([
      {
        path: '/blaze',
        name: 'blaze',
        component: Vue.component('blaze'),
      },
    ]);
  });
</script>
