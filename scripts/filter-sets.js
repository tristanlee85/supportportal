Ext.define('Customization.view.filtersets.FilterSets', {
    extend: 'Ext.button.Button',
    alias: 'widget.filtersetsbutton',
    
    text: 'Filter Sets',
    ui: 'blue-button',
    
    constructor: function (config) {
        var me = this,
            store = Ext.data.StoreManager.lookup('FilterSets');
        
        me.callParent([config]);
        
        if (store.isLoaded()) {
            me.initMenu();
        } else {
            store.on('load', me.initMenu, me);
        }
    },
    
    initMenu: function () {
        var me = this,
            configUtil = Customization.util.Config,
            store = Ext.data.StoreManager.lookup('FilterSets'),
            items = [],
            defaultFilterSet = configUtil.getConfiguration('filter-sets', null);
        
        defaultFilterSet = defaultFilterSet && defaultFilterSet.default || 0;
        
        store.each(function (record) {
            items.push({
                text: record.get('name'),
                record: record,
                iconAlign: 'left',
                iconCls: Ext.String.format('x-fa fa{0}-square-o filterset-default', defaultFilterSet === record.getId() ? '-check' : '')
            })
        });
        
        me.setMenu({
            xtype: 'menu',
            items: items,
            listeners: {
                click: function (menu, item, e) {
                    var target = Ext.get(e.target),
                        record = item.record;
                    
                    if (target.hasCls('filterset-default')) {
                        Customization.util.Config.setConfiguration('filter-sets', {default: record.getId()});
                        me.initMenu(Ext.data.StoreManager.lookup('FilterSets'));
                        me.showMenu();
                    } else {
                        me.up('portal-ticket-grid-grid').fireEvent('filtersetselect', record);
                    }
                }
            }
        });
    }
});

Ext.define('Override.view.ticket.grid.Grid', {
    override: 'Portal.view.ticket.grid.Grid',
    
    initComponent: function () {
        var me = this,
            configUtil = Customization.util.Config,
            defaultFilterSet = configUtil.getConfiguration('filter-sets', null),
            filterSetStore = Ext.data.StoreManager.lookup('FilterSets'),
            container;
        
        me.callParent();
        
        me.dockedItems.remove(me.getFilterDock());
        me.setFilterDock(null);
        
        // create a new container to dock
        container = Ext.create({
            xtype: 'container',
            dock: 'top',
            layout: {
                type: 'box',
                align: 'stretch',
                vertical: me.getXType() === 'portal-ticket-grid-mini'
            },
            items: [{
                xtype: 'filtersetsbutton'
            }, {
                xtype: 'gridfilters-dock',
                store: me.getStore(),
                flex: 1
            }]
        });
        
        // add it to the dock
        me.addDocked(container);
        
        me.on('filtersetselect', me.onFilterSetSelect);
        
        defaultFilterSet = defaultFilterSet && defaultFilterSet.default || 0;
        
        // the filter set store may not be loaded yet
        filterSetStore.on('load', function () {
            var record = filterSetStore.findRecord('id', defaultFilterSet);
            
            if (record) {
                me.onFilterSetSelect(record);
            }
        }, filterSetStore, {single: true});
        
        if (filterSetStore.isLoaded()) {
            filterSetStore.fireEvent('load');
        }
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
                    value: value
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
