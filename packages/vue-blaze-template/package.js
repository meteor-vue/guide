Package.describe({
  name: 'vue-blaze-template',
  version: '0.1.0',
  summary: 'Render Blaze templates in Vue components'
});

Package.onUse(function(api) {
  api.versionsFrom('1.4.1');

  api.use([
    'ecmascript',
    'blaze',
    'templating',
    'ejson',
    'underscore'
  ]);

  api.use([
    'akryum:vue-router',
    'akryum:vue-router2'
  ], {weak: true});

  api.mainModule('main.js', 'client');
});
