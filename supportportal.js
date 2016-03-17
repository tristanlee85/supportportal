// ==UserScript==
// @name         SenchaPortal
// @namespace    SenchaPortal
// @version      2.1.0
// @description  Contains temporary fixes to be applied to the portal
// @author       Tristan Lee
// @match        https://test-support.sencha.com
// @grant        none
// ==/UserScript==

(function () {
    /**
     * Customizations are overrides to be applied to the application as it's loaded.
     * These can be anything including bug fixes, improvements, or new features. Each
     * customization is loaded and activated depending on the user's setting. You may
     * disable any customizations under the 'Settings > Additional Customizations'
     * menu.
     *
     * For the sake of consistency, classes should be defined in the `Customization` namespace.
     * Overrides should be defined in the `Override` namespace.
     *
     * Configurations can be defined with the following parameters:
     * - text : String (optional) - friendly display name for the customization
     * - description : String (optional) - short description about the customization
     * - type : String (required) - can be one of the following: bug|improvement|feature
     * - required : Boolean (optional) - if `true`, this customization will always be enabled
     * - fn : Function (required) - mutually exclusive to `url`, this contains the heart of the customization
     * - url : String (required) - mutually exclusive to `fn`, this loads a remote customization
     */
    var customizations = {
        'error-reporting': {
            text:        'Disable Error Reporting',
            description: 'Prevents application errors from being reported',
            type:        'feature',
            fn:          function () {

                Ext.define('Override.error.Manager', {}, function () {
                    Ext.error.Manager.setActive({onerror: false, exterror: false});
                });
            }
        },

        'settings-custom': {
            description: 'Adds a menu item for toggling customizations',
            type:        'feature',
            required:    true,
            fn:          function () {
                Ext.define('Customization.view.Customizations', {
                    extend: 'Ext.grid.Panel',
                    alias:  'widget.customsgrid',

                    store:       {
                        type:       'chained',
                        source:     'portal-customizations',
                        groupField: 'type',

                        // only show the ones that aren't forced to be enabled
                        filters: [{
                            property: 'required',
                            value:    false
                        }]
                    },
                    title:       'Available Customizations',
                    columnLines: true,
                    columns:     [{
                        text:      'ID',
                        dataIndex: 'id',
                        width:     100
                    }, {
                        text:      'Name',
                        dataIndex: 'text',
                        width:     150
                    }, {
                        text:      'Description',
                        dataIndex: 'description',
                        flex:      1
                    }, {
                        text:      'Type',
                        dataIndex: 'type',
                        renderer:  function (v) {
                            return Ext.util.Format.capitalize(v);
                        }
                    }, {
                        xtype:     'booleancolumn',
                        text:      'Enabled',
                        dataIndex: 'enabled',
                        trueText:  'Yes',
                        falseText: 'No'
                    }, {
                        xtype:     'actioncolumn',
                        dataIndex: 'enabled',
                        width:     50,
                        items:     [{
                            getClass: function (v, metadata, record) {
                                return ['x-fa', v ? 'fa-toggle-on' : 'fa-toggle-off'].join(' ');
                            },
                            handler:  function (grid, rowIdx, colIdx, meta, event, record) {
                                record.set('enabled', !record.get('enabled'));
                            }
                        }]
                    }],
                    features:    [{
                        ftype:          'grouping',
                        groupHeaderTpl: '{name:capitalize}'
                    }],
                    viewConfig:  {
                        stripeRows: true,
                        emptyText:  'There are no customizations to configure'
                    },
                    tbar:        {
                        xtype:  'container',
                        layout: 'center',
                        items:  [{
                            layout: {
                                type:  'vbox',
                                align: 'middle'
                            },
                            items:  [
                                {
                                    html: 'To apply changes, you must reload the application.'
                                },
                                {
                                    xtype:   'button',
                                    text:    'Reload Application',
                                    handler: function () {
                                        window.location.reload(false);
                                    }
                                }
                            ]
                        }]
                    }
                });

                Ext.define('Override.util.routers.Settings', {}, function () {
                    var map = Portal.util.routers.Settings.getViewMap();
                    Ext.merge(map.settings, {custom: {admin: true, fn: 'showSettingCustom'}});
                    Portal.util.routers.Settings.setViewMap(map);

                    Ext.apply(Portal.util.routers.Settings, {
                        showSettingCustom: function () {
                            var me = this,
                                cls = Customization.view.Customizations,
                                feature = 'settings-portal-custom',
                                grid = me.centerHasChild(cls.prototype.xtype);
                            me.addWest();
                            if (!grid) {
                                grid = me.showCenter(cls, feature);
                            }
                        }
                    });
                });

                Ext.define('override.view.main.West', {
                    override: 'Portal.view.main.West',

                    initComponent: function () {
                        var me = this;
                        me.callParent();

                        me.on('render', function (me) {
                            var settings = this.getComponent('settings'),
                                items = settings.items;
                            items = Ext.Array.merge(items, [
                                {
                                    xtype: 'sencha-westitemseperator'
                                },
                                {
                                    html:   'Additional Customizations',
                                    icon:   'fa-wrench',
                                    itemId: 'customizations',
                                    hash:   {
                                        dashboard:    null,
                                        download:     null,
                                        home:         null,
                                        log:          null,
                                        login:        null,
                                        metrics:      null,
                                        order:        null,
                                        popup:        null,
                                        roundrobin:   null,
                                        settings:     'settings-custom',
                                        subscription: null,
                                        team:         null,
                                        ticket:       null,
                                        user:         null
                                    }
                                }]);

                            settings.items = items;
                        });
                    }
                });
            }
        },
        'credits-scroll':  {
            text:        'Quick-scroll Credits',
            description: 'Disables mouse wheel events for the `Credits Used`',
            type:        'improvement',
            fn:          function () {
                Ext.define('Override.view.ticket.view.Details', {
                    override: 'Portal.view.ticket.view.Details',

                    constructor: function (config) {
                        var me = this;

                        me.callParent([config]);
                        me.down('numberfield[fieldLabel^=Credits]').mouseWheelEnabled = false;
                    }
                });
            }
        }
    };


    /** ************************************************************************************************************ **/
    window.Ext = Ext || {};

    // because of when the scripts are executed by the extension, we must
    // check to see if the framework is available before applying
    var interval = setInterval(function () {
            // When the Microloader is available, we'll initialize everything
            if (Ext.Microloader) {
                clearInterval(interval);

                var store,
                    fnSuccess = function (id) {
                        Ext.log({level: 'info', msg: Ext.String.format('- \'{0}\': success', id)});
                    },
                    fnError = function (id, ex) {
                        Ext.log({
                            level: 'error',
                            msg:   Ext.String.format('- \'{0}\': failure', id),
                            stack: true,
                            dump:  ex || null
                        });
                    };

                Ext.Microloader.onMicroloaderReady(function () {
                    // initialize the store with available customizations
                    store = initStore(customizations);

                    Ext.log({indent: 1, msg: 'Applying portal customizations...'});
                    store.each(function (record) {
                        var id = record.get('id'),
                            fn = record.get('fn'),
                            url = record.get('url'),
                            enabled = record.get('enabled');

                        // ensure both properties weren't supplied
                        if (fn && url) {
                            Ext.log({
                                level: 'warn',
                                msg:   Ext.String.format('Unable to apply \'{0}\'. \'fn\' and \'url\' must be mutually exclusive.', id)
                            });
                            return;
                        }
                        // make sure it's enabled for the user
                        else if (!enabled) {
                            return;
                        }

                        // invoke the function
                        if (fn) {
                            try {
                                fn.apply(this, [id]);
                                fnSuccess(id);
                            } catch (e) {
                                fnError(id, e);
                            }
                        }

                        // load the remote source; this should be synchronous since it's before Ext.isReady
                        else {
                            Ext.Loader.loadScript({
                                url:     url,
                                onLoad:  function () {
                                    fnSuccess(id);
                                },
                                onError: function () {
                                    fnError(id);
                                }
                            });
                        }
                    });

                    Ext.log({outdent: 1, level: 'info', msg: 'Portal customizations applied!'});
                });

            }
        }, 10),

        initStore = function (customizations) {
            Ext.define('Customization', {
                extend: 'Ext.data.Model',

                fields: [
                    {name: 'id', type: 'string', unique: true},
                    {name: 'text'},
                    {name: 'description'},
                    {name: 'type'},
                    {name: 'required', type: 'boolean', defaultValue: false},
                    {name: 'fn', type: 'auto'},
                    {name: 'url'},
                    {name: 'enabled', type: 'boolean', defaultValue: false}
                ],

                proxy: {
                    type: 'memory' // really wish the LocalStorage proxy was available...
                }
            });

            var store = Ext.create('Ext.data.Store', {
                    storeId:   'portal-customizations',
                    model:     'Customization',
                    autoLoad:  true,
                    autoSync:  true,
                    listeners: {
                        write: function (store, operation) {
                            // there should always be only 1 record since the sync is made per action
                            var record = operation.getRecords()[0];
                            storage.setItem(record.get('id'), record.get('enabled'));
                        }
                    }
                }),
                storage = Ext.util.LocalStorage.get('portal-customizations');

            Ext.iterate(customizations, function (key, value) {
                store.add({
                    id:          key,
                    text:        value.text || key,
                    description: value.description,
                    type:        value.type,
                    required:    value.required,
                    fn:          value.fn,
                    url:         value.url,
                    enabled:     value.required === true || storage.getItem(key) === 'true'
                });
            });

            return store;
        };
})();
