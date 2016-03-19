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
