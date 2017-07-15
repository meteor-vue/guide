import {_} from 'meteor/underscore';
import {Blaze} from 'meteor/blaze';
import {EJSON} from 'meteor/ejson';

const templateTypes = [String, Object];

function normalizeVnode(vnode) {
  vnode = _.pick(vnode, 'children', 'tag', 'key', 'isComment', 'isStatic', 'text', 'raw', 'ns', 'data');
  vnode.children = _.map(vnode.children, normalizeVnode);
  vnode.data = _.omit(vnode.data, 'hook', 'on', 'pendingInsert');
  return vnode;
}

function normalizeVnodes(vnodes) {
  return _.map(vnodes, normalizeVnode);
}

function vnodesEquals(vnodes1, vnodes2) {
  return EJSON.equals(normalizeVnodes(vnodes1), normalizeVnodes(vnodes2));
}

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

  data() {
    return {
      renderedSlot: null,
    };
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

    updateSlot() {
      if (this.$slots.default) {
        // To prevent observer to be setup on vnodes.
        this.$slots.default._isVue = true;
      }
      this.renderedSlot = this.$slots.default;
    },

    renderTemplate() {
      if (this.blazeView) {
        Blaze.remove(this.blazeView);
        this.blazeView = null;
      }

      // To make it available before we start rendering ther Blaze template.
      this.updateSlot();

      const vm = this;
      this.blazeView = Blaze.renderWithData(this.getTemplate().constructView(function () {
        // This function defines how "Template.contentBlock" gets rendered inside block helpers.
        // It does not provide any Blaze content (returns null), but after Blaze renders it,
        // it uses Vue vdom patching to render slot content.

        const view = this;

        if (!view.isRendered) {
          view.onViewReady(function () {
            view.autorun(function (computation) {
              const newVnodes = vm.renderedSlot;
              const prevVnodes = view._vnodes;
              view._vnodes = newVnodes;

              // To prevent unnecessary reruns of the autorun if patch registers any dependency.
              // The only dependency we care about is on "renderedSlot" which has already been established.
              Tracker.nonreactive(function () {
                if (!prevVnodes) {
                  _.each(newVnodes, function (vnode, i, list) {
                    // We prepend rendered vnodes before "lastNode" in order.
                    // So rendered content is in fact between "firstNode" and "lastNode".
                    vm.__patch__(null, vnode, false, false, view._domrange.parentElement, view.lastNode());
                  });
                }
                else {
                  _.each(_.zip(prevVnodes, newVnodes), function (vnodes, i, list) {
                    vm.__patch__(vnodes[0], vnodes[1]);
                  });
                }
              })
            });
          });
          view.onViewDestroyed(function () {
            if (vm._vnodes) {
              _.each(vm._vnodes, function (vnode, i, list) {
                vm.__patch__(vnode, null);
              });
              vm._vnodes = null;
            }
          });
        }

        return null;
      }), () => this.data, this.$el, null, this);
      this.renderedToElement = this.$el;
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

    this.renderedToElement = null;
  },

  render(createElement) {
    return createElement(this.tag);
  },

  updated() {
    // We rerender the template when primary element changes (when tag changes).
    if (this.renderedToElement !== this.$el) {
      this.renderTemplate();
    }
    // Slot changed.
    else if (!vnodesEquals(this.renderedSlot, this.$slots.default)) {
      this.updateSlot();
    }
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
