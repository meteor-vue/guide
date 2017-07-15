<template>
  <div>
    <p>Data context from Vue: <input type="string" v-model="dataContext"></p>
    <p>Reactive slot value: <input type="string" v-model="slotValue"></p>
    <blaze-template template="blaze-template" :data="{dataContext}"></blaze-template>
    <blaze-template template="blaze-block-helper">
      <p>This is Slot content from Vue: {{slotValue}}</p>
      <life-cycle />
    </blaze-template>
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
        dataContext: "foo",
        slotValue: "bar",
      }
    },
  }
</script>
