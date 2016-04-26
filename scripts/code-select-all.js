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
            createSelection = function () {
                var range = document.createRange(),
                    selection = window.getSelection(),
                    text;

                selection.removeAllRanges();
                range.selectNode(node);
                selection.addRange(range);
                text = selection.toString().trim();

                return text;
            },
            text;

        // create the selection and returns the text
        text = createSelection();

        // copy it
        Messenger.sendMessage('copyToClipboard', [text], function (response) {
            if (response.success) {
                var head = document.getElementsByTagName('head')[0],
                    style = document.createElement('style');

                // re-create the selection so it's visible to the user
                createSelection();

                style.type = 'text/css';
                style.innerHTML = [
                    '.code:after {',
                    "    content: 'copied!';",
                    '    background-color: #ffff9c;',
                    '}'].join(' ');
                head.appendChild(style);
                setTimeout(function () {
                    head.removeChild(style);
                }, 2000);
            }
        });
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
        '    border-bottom-right-radius: 5px;',
        '}'].join(' ');
    document.getElementsByTagName('head')[0].appendChild(style);
});
