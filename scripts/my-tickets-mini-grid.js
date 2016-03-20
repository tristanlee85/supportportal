Ext.define('Override.view.ticket.ContainerController', {
    override: 'Portal.view.ticket.ContainerController',

    showFullGrid: function (view, info) {
        var me = this,
            fullGrid = view.getFullGrid(),
            nextFilter = Sencha.nextFilter,
            ticketView, store, cm, ownerCol;

        if (fullGrid) {
            if (fullGrid.isComponent) {
                if (fullGrid.ownerCt === view) {
                    return;
                }
            } else {
                ticketView = view.getTicketView();
                if (ticketView && ticketView.isComponent) {
                    store = Ext.getStore('ticketStore');
                    store.blockLoad();
                }
                view.setFullGrid(fullGrid = Ext.create(fullGrid));

                // Get the Assigned To column and apply the current user as
                // a filter value if a value is not already set. This will
                // set the current user as the initial filter so only their
                // tickets are displayed. The filter can be removed from the
                // grid to see all available tickets.
                cm = fullGrid.getColumnManager();
                ownerCol = cm.getHeaderByDataIndex('owner');
                if (ownerCol && !ownerCol.filter.active) {
                    ownerCol.filter.setValue(Sencha.User.get('uid'));
                }

                store && store.unblockLoad();
            }
            Ext.batchLayouts(function () {
                //TODO would like to remove ticket view here
                view.layout.setActiveItem(fullGrid);
                me.handleNextFilter(nextFilter);
            });
        }
    }
});
