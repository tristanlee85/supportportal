Ext.define('Override.view.ticket.TicketContainerModel', {
    override: 'Portal.view.ticket.TicketContainerModel',

    constructor: function (config) {
        var me = this,
            formulas;
        me.callParent([config]);

        formulas = me.getFormulas();
        formulas.ticketTitle = function (get) {
            var record = get('record'),
                jiras;
            if (record) {
                jiras = record.get('jiras');
                return (jiras ? '<span class="fa fa-bug" data-qtip="' + Ext.util.Format.plural(jiras.length, 'Issue') + '"></span>' : '') + Ext.String.format('<a target="_blank" href="https://support.sencha.com/#ticket-{0}">#{0}</a>', record.getId()) + ' ' + record.get('title');
            } else {
                return '';
            }
        };

        me.setFormulas(formulas);
    },
});
