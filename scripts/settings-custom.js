Ext.define('Override.app.ViewModel', {
    override: 'Ext.app.ViewModel',

    privates: {
        onStoreBind: function (cfg, oldValue, binding) {
            var me = this;
            me.callParent(arguments);
            var info = me.storeInfo,
                key = binding.$storeKey,
                store = info[key];
            if (store) {
                store.fireEvent('storebind', store, me);
            }
        },

        applyStores: function (stores) {
            var me = this,
                root = me.getRoot(),
                key, cfg, storeBind, stub, listeners, isStatic;

            me.storeInfo = {};
            me.listenerScopeFn = function () {
                return me.getView().getInheritedConfig('defaultListenerScope');
            };
            for (key in stores) {
                cfg = stores[key];
                if (cfg.isStore) {
                    cfg.$wasInstance = true;
                    me.setupStore(cfg, key);
                    continue;
                } else if (Ext.isString(cfg)) {
                    cfg = {
                        source: cfg
                    };
                } else {
                    cfg = Ext.apply({}, cfg);
                }
                // Get rid of listeners so they don't get considered as a bind
                listeners = cfg.listeners;
                delete cfg.listeners;
                storeBind = me.bind(cfg, me.onStoreBind, me, {trackStatics: true});
                if (storeBind.isStatic()) {
                    // Everything is static, we don't need to wait, so remove the
                    // binding because it will only fire the first time.
                    storeBind.destroy();
                    me.createStore(key, cfg, listeners);
                } else {
                    storeBind.$storeKey = key;
                    storeBind.$listeners = listeners;
                    stub = root.createStubChild(key);
                    stub.setStore(storeBind);
                }

                cfg = this.storeInfo[key];

                if (cfg && cfg.isStore) {
                    cfg.fireEvent('storebind', cfg, me);
                }
            }
        }
    }
})

Ext.define('Customization.view.Customizations', {
    extend: 'Ext.grid.Panel',
    alias:  'widget.customsgrid',

    viewModel: {
        data:     {
            recordsModified: 0
        },
        formulas: {
            modified: {
                get: function (get) {
                    return get('recordsModified') > 0;
                },

                set: function (record) {
                    this.set('recordsModified', this.get('recordsModified') + 1);
                }
            }
        },

        stores: {
            customizations: {
                type:       'chained',
                source:     'portal-customizations',
                groupField: 'type',

                // only show the ones that aren't forced to be enabled
                filters: [{
                    property: 'required',
                    value:    false
                }],

                listeners: {
                    storebind: function (store, viewModel) {
                        store.on('update', function (store, record) {
                            viewModel.set('modified', record);
                        });
                    }
                }
            }
        }
    },

    bind: {
        store: '{customizations}'
    },

    ui:          'blue-panel',
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
        emptyText: 'There are no customizations to configure'
    },
    bbar:        {
        xtype:  'container',
        bind:   {
            hidden: {
                bindTo: '{!modified}',
                deep:   true
            }
        },
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
                    ui:      'blue-button',
                    iconCls: 'x-fa fa-refresh',
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
