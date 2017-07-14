import {Blaze} from 'meteor/blaze';

const templateTypes = [String, Object];

export default {
  name: 'blaze-template',

  props: {
    template: {
      type: templateTypes,
      required: true,
    },
    tag: {
      type: String,
      default: 'div'
    },
    data: Object,
  },

  methods: {
    getTemplate() {
      let template = this.template;
      if (typeof template === 'string') {
        template = Blaze._getTemplate(template, null);
      }

      if (!template) {
        throw new Error(`Blaze template '${this.template}' not found.`);
      }

      return template;
    },

    renderTemplate() {
      if (this.blazeView) {
        Blaze.remove(this.blazeView);
        this.blazeView = null;
      }

      this.blazeView = Blaze.renderWithData(this.getTemplate(), () => this.data, this.$el, null, this);
    },
  },

  watch: {
    // Template has changed.
    template(newValue, oldValue) {
      this.renderTemplate();
    },
  },

  created() {
    // So that we can use this Vue component instance as a parent view to the Blaze template.
    this._scopeBindings = {};
  },

  render(createElement) {
    return createElement(this.tag);
  },

  // Tag has changed.
  updated() {
    this.renderTemplate();
  },

  // Initial rendering.
  mounted() {
    this.renderTemplate();
  },

  destroyed() {
    if (this.blazeView) {
      Blaze.remove(this.blazeView);
      this.blazeView = null;
    }
  },
}
