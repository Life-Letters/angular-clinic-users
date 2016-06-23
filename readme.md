# Angular User Service

Provides common user functionality across the different Life Letter
Angular apps.



## Install and usage

To install

    bower install Life-Letters/angular-users --save

Within `app.js` add the dependency:

    'life.users'

Within the module `config` function, add:

    userServiceProvider.setUrl(...);
    userServiceProvider.addBehaviour('fetchFoo', function(user) { ... });

For further details, please refer to `index.html`.


