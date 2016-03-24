Ext.define('Override.view.ticket.grid.Grid', {
    override: 'Portal.view.ticket.grid.Grid',

    constructor: function (config) {
        var cfg = Customization.util.Config.getConfiguration('auto-refresh-grid', {});
        this.setAutoRefreshStore(cfg.autoRefreshMain && cfg.autoRefreshMain === 'true');
        this.viewConfig = Ext.apply(this.viewConfig, {loadMask: cfg.loadMaskMain && cfg.loadMaskMain === 'true'});

        this.callParent([config]);
    }
});

Ext.define('Override.view.ticket.grid.Mini', {
    override: 'Portal.view.ticket.grid.Mini',

    constructor: function (config) {
        var cfg = Customization.util.Config.getConfiguration('auto-refresh-grid', {});
        this.setAutoRefreshStore(cfg.autoRefreshMini && cfg.autoRefreshMini === 'true');
        this.viewConfig = Ext.apply(this.viewConfig, {loadMask: cfg.loadMaskMini && cfg.loadMaskMini === 'true'});

        this.callParent([config]);
    }
});

Ext.define('Customization.view.autorefresh.Configurator', {
    extend: 'Customization.view.Configurator',

    layout: {
        type:  'hbox',
        align: 'stretchmax'
    },

    items: [{
        xtype:    'fieldset',
        title:    'Main Ticket Grid',
        layout:   'vbox',
        flex:     1,
        defaults: {
            labelAlign:     'left',
            inputValue:     'true',
            uncheckedValue: 'false'
        },
        items:    [{
            xtype:      'checkbox',
            fieldLabel: 'Auto-refresh',
            name:       'autoRefreshMain'
        }, {
            xtype:      'checkbox',
            fieldLabel: 'Loadmask',
            name:       'loadMaskMain'
        }]
    }, {
        xtype:    'fieldset',
        title:    'Mini Ticket Grid',
        layout:   'vbox',
        flex:     1,
        defaults: {
            labelAlign:     'left',
            inputValue:     'true',
            uncheckedValue: 'false'
        },
        items:    [{
            xtype:      'checkbox',
            fieldLabel: 'Auto-refresh',
            name:       'autoRefreshMini'
        }, {
            xtype:      'checkbox',
            fieldLabel: 'Loadmask',
            name:       'loadMaskMini'
        }]
    }]
});
