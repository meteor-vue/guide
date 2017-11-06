A very simple example Meteor app using Vue-based Tracker and Vue components, and how to integrate with Blaze.

You can run it:

```
$ git clone https://github.com/meteor-vue/guide.git
$ meteor npm install
$ meteor
```

If you want to use this version of Vue which supports Vue-based Tracker in your app, you have to:
* add to `package.json` dependencies `"vue": "git://github.com/meteor-vue/vue.git#meteor"` (see [#4652](https://github.com/vuejs/vue/pull/4652))
* add `https://github.com/meteor-vue/tracker.git` as a [git submodule](https://git-scm.com/docs/git-submodule) to `packages/tracker` (see [#47](https://github.com/meteor/meteor-feature-requests/issues/47)):

    ```
    $ git submodule add https://github.com/meteor-vue/tracker.git packages/tracker 
    ```
* add the following to your `package.json`:

    ```
    "meteor": {
      "vueVersion": 2
    }
    ```

* add [`vuejs:meteor-integration` package](https://github.com/meteor-vue/meteor-integration) package to get `$autorun` and `$subscribe` inside Vue components
* if you need integration with Blaze, use [`vuejs:blaze-integration` package](https://github.com/meteor-vue/blaze-integration)

Note: Some life-cycle methods (i.e., `created` and `mounted`) in Vue are run inside a reactive context.
This means that if you call reactive code inside those methods, the code can invalidate the context and trigger update.
Another effect of this is that Tracker reactive code from `created` gets invalidated on the next update, but is never rerun
(because `created` callback is not run again, but `updated` is instead). If you do not want this, consider running reactive
code in `created` inside `Tracker.nonreactive` (to prevent reactivity) or `$autorun` (to limit its scope and make it persist
across updates).

See [TodoMVC Meteor + Vue.js example](https://github.com/meteor-vue/todomvc/blob/master/client/todos-display.vue) how to use all this together in a
component, in a pure Vue-only Meteor app.
