<template>
  <div>
    <p>Data context from Vue: <input type="string" v-model="dataContext"></p>
    <p>Reactive slot value: <input type="string" v-model="slotValue"></p>
    <blaze-template template="blaze-template" :data="{dataContext}"></blaze-template>
    <blaze-template template="blaze-block-helper">
      <p>This is slot content from Vue: {{slotValue}}</p>
      <life-cycle :timestamp="timestamp" />
    </blaze-template>
  </div>
</template>

<script>
  import Vue from 'vue';
  import {RouterFactory} from 'meteor/akryum:vue-router2';

  const component = {
    data() {
      return {
        dataContext: "foo",
        slotValue: "bar",
        timestamp: new Date().toString(),
      }
    },

    created() {
      this.interval = setInterval(() => {
        this.timestamp = new Date().toString();
      }, 1000);
    },

    destroyed() {
      if (this.interval) {
        clearInterval(this.interval);
        this.interval = null;
      }
    },
  };

  RouterFactory.configure((factory) => {
    factory.addRoutes([
      {
        component,
        path: '/blaze',
        name: 'blaze',
      },
    ]);
  });

  export default component;
</script>
