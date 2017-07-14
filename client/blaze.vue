<template>
  <div>
    <div>Data context from Vue: <input type="string" v-model="dataContext"></div>
    <blaze-template template="blaze-template" :data="{dataContext: dataContext}"></blaze-template>
  </div>
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

  export default {
    data() {
      return {
        dataContext: "foobar",
      }
    },
  }
</script>
