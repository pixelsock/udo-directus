<template>
    <div class="layout-options">
      <div class="field">
        <div class="label">View Density</div>
        <v-select
          v-model="viewDensity"
          :items="[
            { text: 'Default', value: false },
            { text: 'Compact', value: true }
          ]"
        />
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'LayoutOptions',
    props: {
      layoutOptions: {
        type: Object,
        default: () => ({}),
      },
      layoutQuery: {
        type: Object,
        default: () => ({}),
      },
      collection: {
        type: String,
        required: true,
      },
      fieldNames: {
        type: Array,
        default: () => [],
      },
    },
    emits: ['update:options', 'update:query'],
    computed: {
      viewDensity: {
        get() {
          return this.layoutOptions?.dense || false;
        },
        set(newValue) {
          this.$emit('update:options', {
            ...this.layoutOptions,
            dense: newValue,
          });
        },
      },
    },
  };
  </script>
  
  <style scoped>
  .layout-options {
    padding: 12px;
  }
  
  .field {
    margin-bottom: 24px;
  }
  
  .label {
    margin-bottom: 8px;
    font-weight: 500;
  }
  </style>