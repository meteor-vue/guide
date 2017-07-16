<template>
  <div>
    <ul>
      <li v-for="state in states">{{state}}</li>
    </ul>
    <p>Timestamp: {{timestamp}}</p>
  </div>
</template>

<script>
  export default {
    props: {
      timestamp: {
        default: 'none',
      },
    },

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