<template>
  <ul>
    <li v-for="state in states">{{state}}</li>
  </ul>
</template>

<script>
  export default {
    data() {
      return {
        states: [],
      };
    },

    created() {
      this.states.push("created");
    },

    beforeMount() {
      this.states.push("beforeMount");
    },

    mounted() {
      this.states.push("mounted");
    },
  }
</script>