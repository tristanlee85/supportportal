Ext.define('Customization.view.filtersets.FilterSets', {
    extend: 'Ext.button.Button',
    alias:  'widget.filtersetsbutton',

    text: 'Filter Sets',

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
            tbar;
        me.callParent();
        tbar = me.getDockedItems('toolbar[dock=top]')[0];

        // only the full grid has this
        if (tbar) {
            tbar.insert(3, {xtype: 'filtersetsbutton'});
            me.on('filtersetselect', me.onFilterSetSelect);
        }
    },

    onFilterSetSelect: function (record) {
        var me = this,
            store = me.getStore(),
            filters = me.getFilters().filters,
            setFilters = record.get('filters'),
            newFilters = [],
            setFilter, value, dataIndex, filter, operator, checked;

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
