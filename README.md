An very simple example Meteor app using Vue-based Tracker and Vue components, and how to integrate with Blaze.

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

* use [meteor.js](https://github.com/meteor-vue/todomvc/blob/master/client/meteor.js) code to get `$autorun` and `$subscribe` inside Vue components
  (pending publishing it as a package)
* if you need integration with Blaze, use [`vuejs:blaze-integration` package](https://github.com/meteor-vue/blaze-integration)

See [TodoMVC Meteor + Vue.js example](https://github.com/meteor-vue/todomvc/blob/master/client/todos-display.vue) how to use all this together in a
component, in a pure Vue-only Meteor app.
