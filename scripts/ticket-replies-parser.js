Ext.define('Override.view.ticket.grid.TicketController', {
    override: 'Portal.view.ticket.grid.TicketController',

    // matches URLs except those otherwise wrapped in a tag
    urlRe: /(https?:\/\/(?:w{1,3}.)?[^\s]*?(?:\.[a-z0-9/?!@#$=\-]+)+)(?![^<]*?(?:<\/\w+>|\/?>))/gi,

    // matches the incorrect list parsing when BB code is used within list items
    listRe: /(<li>.*?)(<\/li>)(.*?)<br>(?=<(li|\/ul)>)/gi,

    getTicketReplies: function (ticket) {
        var me = this,
            replies = me.callParent([ticket]);

        if (replies) {
            Ext.Array.forEach(replies, function (reply, index, replies) {
                var text = reply.reply_body;

                // wrap remaining URL matches in anchor tag
                text = text.replace(me.urlRe, '<a target="_blank" href="$1">$1</a>');

                // replace rogue </li> at correct position
                text = text.replace(me.listRe, '$1$3</li>');

                reply.reply_body = text;
            });

            return replies;
        }
    }
});
