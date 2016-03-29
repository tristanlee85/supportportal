Ext.define('Override.view.ticket.grid.TicketController', {
    override: 'Portal.view.ticket.grid.TicketController',

    onImageLoad: function(e, t) {
        var win = this,
            header = win.header,
            height = Math.min(document.body.clientHeight * 0.9, t.height + (header ? header.getHeight() : 0)),
            width = Math.min(document.body.clientWidth * 0.9, t.width);
        win.addCls('has-thumbnail');
        win.setSize(width, height);
        win.body.setSize(width, height); // prevent minor size difference due to padding/borders
        win.update(Ext.String.format('<div style="overflow:scroll;" class="thumbnail"><img src="{0}"></div>', t.src));
        win.center();
    }
});
