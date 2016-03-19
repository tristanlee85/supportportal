Ext.define('Override.store.Tickets', {
    override: 'Portal.store.Tickets',

    constructor: function (config) {
        var me = this;
        me.callParent([config]);

        me.addFilter({
            property: 'owner',
            operator: '=',
            value:    Sencha.User.get('uid')
        });
    }
});
