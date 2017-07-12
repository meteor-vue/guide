An example Meteor app using Vue-based Tracker and Vue components. You can run it:

```
$ git clone https://github.com/meteor-vue/guide.git
$ meteor npm install
$ meteor
```

If you want to use this version of Vue which suport Vue-based Tracker in your app, you have to:
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
