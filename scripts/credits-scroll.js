Ext.define('Override.view.ticket.view.Details', {
    override: 'Portal.view.ticket.view.Details',

    constructor: function (config) {
        var me = this;

        me.callParent([config]);
        me.down('numberfield[name=xcredits]').mouseWheelEnabled = false;
    }
});
