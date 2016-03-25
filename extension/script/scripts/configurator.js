/**
 * This fires a `storebind` event once binding has completed. The purpose for
 * this is so that there can be context of the ViewModel from the Store.
 */
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
});

/**
 * This class defines the configurator that other classes should extend.
 */
Ext.define('Customization.view.ConfiguratorModel', {
    extend: 'Ext.app.ViewModel',
    alias:  'viewmodel.configurator',

    data: {
        title:               null,
        customizationRecord: null
    }
});

Ext.define('Customization.view.ConfiguratorController', {
    extend: 'Ext.app.ViewController',
    alias:  'controller.configurator',

    control: {
        'configurator': {
            render: 'loadConfiguration'
        }
    },

    cancelChanges: function () {
        this.getView().fireEvent('configcancel');
    },

    saveChanges: function () {
        var view = this.getView(),
            record = view.getViewModel().get('customizationRecord'),
            values = view.getValues();

        // We'll just set the form fields and values directly to storage, hoping they are in the right format.
        Customization.util.Config.setConfiguration(record.get('id'), values);

        view.fireEvent('configsave');
    },

    loadConfiguration: function () {
        var view = this.getView(),
            record = view.getViewModel().get('customizationRecord'),
            values = Customization.util.Config.getConfiguration(record.get('id')),
            dataRecord = new Ext.data.Model();

        // TODO: we should not need to defer this, but without it the values do not get set
        Ext.defer(function () {
            view.getForm().setValues(values);
        }, 10);
    }
});

Ext.define('Customization.view.Configurator', {
    extend:     'Sencha.view.abstracts.Form',
    alias:      'widget.configurator',
    viewModel:  'configurator',
    controller: 'configurator',

    defaults: {
        labelAlign: 'left'
    },
    buttons: [{
        text:    'Cancel',
        ui:      'blue-button',
        handler: 'cancelChanges'
    }, {
        text:     'Save Configuration',
        ui:       'blue-button',
        formBind: true,
        disabled: true,
        handler:  'saveChanges'
    }]
});

/**
 * Classes for the window to contain the configurator
 */
Ext.define('Customization.view.ConfiguratorWindowController', {
    extend: 'Ext.app.ViewController',
    alias:  'controller.configuratorwin',

    control: {
        'configurator': {
            configcancel: 'close',
            configsave:   'close'
        }
    },

    close: function () {
        this.getView().close();
    }

});

Ext.define('Customization.view.ConfiguratorWindow', {
    extend:     'Sencha.view.abstracts.Window',
    controller: 'configuratorwin',

    modal:  true,
    layout: {
        type: 'fit'
    },
    title:  'Configuration'
});

/**
 * Grid for displaying the available customizations
 */
Ext.define('Customization.view.CustomizationsModel', {
    extend: 'Ext.app.ViewModel',
    alias:  'viewmodel.customizations',

    data:     {
        recordsModified: 0
    },
    formulas: {
        modified: {
            get: function (get) {
                return get('recordsModified') > 0;
            },

            set: function () {
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
                property: 'force',
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
});

Ext.define('Customization.view.CustomizationsController', {
    extend: 'Ext.app.ViewController',
    alias:  'controller.customizations',

    toggleCustomization: function (grid, rowIdx, colIdx, meta, event, record) {
        record.set('enabled', !record.get('enabled'));
    },

    showConfigurator: function (grid, rowIdx, colIdx, meta, event, record) {
        var cls = record.get('configurator'),
            instance, win;

        try {
            instance = Ext.create(cls);

            if (instance instanceof Customization.view.Configurator) {

                // I'm not sure if this controller should be directly setting
                // data to the Configurator's VM, but for now it's how we
                // give it reference to the customization record
                instance.getViewModel().set('customizationRecord', record);

                win = Ext.create('Customization.view.ConfiguratorWindow', {
                    items: [instance]
                }).show();
            }
        } catch (e) {
            win.destroy();
            Ext.log({
                msg:   'Unable to load configurator',
                level: 'error',
                dump:  e,
                stack: true
            });
        }

    }
});

Ext.define('Customization.view.Customizations', {
    extend:     'Ext.grid.Panel',
    alias:      'widget.customsgrid',
    viewModel:  'customizations',
    controller: 'customizations',

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
        renderer:  Ext.util.Format.capitalize
    }, {
        xtype:     'booleancolumn',
        text:      'Enabled',
        dataIndex: 'enabled',
        trueText:  'Yes',
        falseText: 'No'
    }, {
        xtype:     'actioncolumn',
        dataIndex: 'enabled',
        width:     75,
        items:     [{
            tooltip:  'Enable/Disable',
            getClass: function (v, metadata, record) {
                return ['x-fa fa-fw', v ? 'fa-toggle-on' : 'fa-toggle-off'].join(' ');
            },
            handler:  'toggleCustomization'
        }, {
            tooltip:    'Configure',
            getClass:   function (v, metadata, record) {
                return 'x-fa fa-fw fa-cog';
            },
            isDisabled: function (view, rowIdx, colIdx, item, record) {
                return !record.get('configurator') || record.get('refreshRequired');
            },
            handler:    'showConfigurator'
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

/**
 * Adds the route for handling display of the grid
 */
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

/**
 * Adds the item to the Settings menu
 */
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
