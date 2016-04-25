Ext.define('Customization.view.filtersets.FilterSets', {
    extend: 'Ext.button.Button',
    alias:  'widget.filtersetsbutton',

    text: 'Filter Sets',
    ui:   'blue-button',

    constructor: function (config) {
        var me = this,
            store = Ext.data.StoreManager.lookup('FilterSets');

        me.callParent([config]);

        if (store.isLoaded()) {
            me.initMenu(store);
        } else {
            store.on('load', me.initMenu, me);
        }
    },

    initMenu: function (store) {
        var me = this,
            items = [];

        store.each(function (record) {
            items.push({text: record.get('name'), record: record})
        });

        me.setMenu({
            xtype:     'menu',
            items:     items,
            listeners: {
                click: function (menu, item) {
                    me.up('portal-ticket-grid-grid').fireEvent('filtersetselect', item.record);
                }
            }
        });
    }
});

Ext.define('Override.view.ticket.grid.Grid', {
    override: 'Portal.view.ticket.grid.Grid',

    initComponent: function () {
        var me = this,
            filterDock = me.getFilterDock(),
            container;

        me.callParent();

        // create a new container to dock
        container = Ext.create({
            xtype:  'container',
            dock:   'top',
            layout: {
                type:     'box',
                align:    'stretch',
                vertical: me.getXType() === 'portal-ticket-grid-mini'
            },
            items:  [filterDock, {
                xtype: 'filtersetsbutton'
            }]
        });

        // remove the current instance of the gridfilters-dock component from the docked items
        me.dockedItems.remove(filterDock);

        // add it to the dock
        filterDock.flex = 1;
        me.addDocked(container);

        me.on('filtersetselect', me.onFilterSetSelect);
    },

    onFilterSetSelect: function (record) {
        var me = this,
            store = me.getStore(),
            filters = me.getFilters().filters,
            setFilters = record.get('filters'),
            newFilters = [],
            setFilter, value, dataIndex, filter, operator;

        for (dataIndex in setFilters) {
            setFilter = setFilters[dataIndex];
            filter = filters[dataIndex];
            operator = null;
            if (filter) {
                if (Ext.isObject(setFilter) && setFilter.value) {
                    operator = setFilter.operator;
                    value = setFilter.value;
                } else {
                    operator = null;
                    value = setFilter;
                }
                if (!operator) {
                    if (filter.isSingleGridFilter) {
                        operator = filter.getOperator();
                    } else {
                        operator = '=';
                    }
                }
                newFilters.push({
                    operator: operator,
                    property: dataIndex,
                    value:    value
                });
            }
        }
        if (newFilters.length) {
            store.clearFilter(true);
            store.filter(newFilters);
        } else {
            store.clearFilter();
        }
    }
});

Ext.define('Override.GridFilters.Dock', {
    override: 'GridFilters.Dock',

    hide: function () {
        var me = this,
            grid = me.up('portal-ticket-grid-grid'),
            isMiniGrid = grid && grid.getXType() === 'portal-ticket-grid-mini',
            el = me.getEl();

        // Hide the component only if it's the mini grid. Otherwise, just set the
        // element to be visibly hidden so that the layout is not modified.
        if (grid) {
            if (isMiniGrid) {
                me.callParent();
            } else if (el) {
                el.setVisible(false);
            }
        }
    },

    show: function () {
        var me = this,
            grid = me.up('portal-ticket-grid-grid'),
            isMiniGrid = grid && grid.getXType() === 'portal-ticket-grid-mini',
            el = me.getEl();

        // Show the component only if it's the mini grid. Otherwise, just set the
        // element to be visible so that the layout is not modified.
        if (grid) {
            if (isMiniGrid || me.isHidden()) {
                me.callParent();
            } else if (el) {
                el.setVisible(true);
            }
        }
    }
});
