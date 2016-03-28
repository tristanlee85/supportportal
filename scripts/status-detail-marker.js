Ext.define('Customization.view.statusdetail.ComboBox', {
    extend: 'Ext.form.field.ComboBox',
    alias: 'widget.status-detail-combo',

    valueField: 'value',
    displayField: 'text',

    setValue: function (value) {
        var me = this,
            store = me.getStore(),
            record = store.find('value', value);

        if (!record) {
            store.add({value: value, text: value});
        }

        me.callParent([value]);;
    }
});

Ext.define('Customization.view.statusdetail.Configurator', {
    extend: 'Customization.view.Configurator',

    viewModel: {
        data: {
            markerPosition: null,
            cellTextColor:  null
        },

        stores: {
            markerStyles: {
                fields: ['value', 'text'],
                data: [{
                    value: false,
                    text: 'Marker Color'
                }, {
                    value: 'initial',
                    text: 'Initial Color'
                }]
            }
        }
    },

    layout: {
        type:  'vbox',
        align: 'stretchmax'
    },
    items:  [{
        xtype:      'fieldcontainer',
        fieldLabel: 'Marker Position',

        labelWidth:  150,
        defaultType: 'radiofield',
        defaults:    {
            flex: 1
        },
        layout:      'hbox',
        allowBlank:  false,
        items:       [
            {
                boxLabel:   'Left',
                name:       'markerPosition',
                inputValue: 'left',
            }, {
                boxLabel:   'Right',
                name:       'markerPosition',
                inputValue: 'right',
            }
        ]
    }, {
        xtype:      'status-detail-combo',
        name:       'cellTextColor',
        fieldLabel: 'Cell Text Color',
        labelWidth: 150,
        allowBlank: false,
        emptyText:  'Enter custom color',
        bind: {
            store: '{markerStyles}'
        }
    }],

    initComponent: function () {
        var me = this;
        me.callParent();

    }
});

Ext.define('Override.view.ticket.grid.Mini', {
    override: 'Portal.view.ticket.grid.Mini',

    constructor: function (config) {
        var me = this
        me.callParent([config]);

        me.setMarkerPosition();
        me.on('columnschanged', function () {
            this.setMarkerPosition();
            this.getView().refresh();
        });
    },

    setMarkerPosition: function () {
        var me = this,
            config = Customization.util.Config.getConfiguration('status-detail-marker', {
                markerPosition: 'left',
                cellTextColor:  null
            }),
            cols, col;

        cols = me.getVisibleColumns();

        // gets the first visible column either to the left or right depending on
        // the config
        Ext.Array.each(cols, function (_col) {
            // set the column the renderer should be applied to
            if (_col.hidden !== true && !col) {
                col = _col;
            }

            // if an original renderer was defined, reset it back so that we don't
            // have multiple markers for every column (applies to when user shows/hides columns)
            if (_col.origRenderer) {
                _col.renderer = _col.origRenderer;
            }
        }, null, config.markerPosition === 'right');

        // Renderer to apply the classes needed to display the marker style.
        // We call the original renderer to get its original display value
        // then just add our classes to the meta data to style the marker.
        col.renderer = (function (origRenderer) {
            return function (id, meta, record) {
                var origValue = origRenderer.apply(col, arguments),
                    status_detail = record.get('status_detail_id');
                meta.tdCls += Ext.String.format(' status-detail{0} status-detail-color {1}', config.markerPosition === 'right' ? '-right' : '', status_detail);
                if (record.get('ticket_read') === 0) {
                    meta.tdCls += ' ticket-unread';
                }

                if (config.cellTextColor) {
                    meta.style = 'color: ' + config.cellTextColor;
                }

                return origValue;
            };
        }(col.origRenderer = col.renderer));
    }
});
