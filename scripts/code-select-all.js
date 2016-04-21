Ext.define('Override.view.ticket.grid.TicketController', {
    override: 'Portal.view.ticket.grid.TicketController',

    init: function (view) {
        view.on({
            click:    this.copyCode,
            element:  'el',
            delegate: 'div.code',
            scope:    view
        });
    },

    copyCode: function (event, target) {
        var node = Ext.fly(target).down('pre').dom,
            event = document.createEvent('Event');

        // create the selection
        if (document.selection) {
            var range = document.body.createTextRange();
            range.moveToElementText(node);
            range.select();
        } else if (window.getSelection) {
            var range = document.createRange();
            range.selectNode(node);
            window.getSelection().addRange(range);
        }

        // copy it
        // this event is defined in the content script
        event.initEvent('copyselectedtext');
        document.dispatchEvent(event);
    }
}, function () {
    var style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = [
        '.code {pointer-events: none;}',
        '.code:after {',
        "    content: 'copy all';",
        '    color: #bcbcbc;',
        '    position: absolute;',
        '    font-family: "klavika-web", helvetica, arial, verdana, sans-serif;',
        '    background-color: #f5f5f5;',
        '    padding: 3px 11px 5px 7px;',
        '    top: 0;',
        '    right: 0;',
        '    font-size: 16px;',
        '    cursor: pointer;',
        '    pointer-events: all;',
        '    -webkit-border-bottom-right-radius: 5px;',
        '    -moz-border-bottom-right-radius: 5px;',
        '    -ms-border-bottom-right-radius: 5px;',
        '    -o-border-bottom-right-radius: 5px;',
            'border-bottom-right-radius: 5px;',
        '}'].join(' ');
    document.getElementsByTagName('head')[0].appendChild(style);
});
