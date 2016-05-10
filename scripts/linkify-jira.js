Ext.define('Customization-JIRAParser.view.ticket.grid.TicketController', {
    override: 'Portal.view.ticket.grid.TicketController',

    // matches a JIRA ID using a reversed look-ahead
    jiraRe: /(\d+-[A-Z]+(?!-?[a-zA-Z]{1,10}))/gi,

    reverseText: function (text) {
        return text.split('').reverse().join('');
    },

    getTicketReplies: function (ticket) {
        var me = this,
            replies = me.callParent([ticket]);

        if (replies) {
            Ext.Array.forEach(replies, function (reply, index, replies) {
                var text = me.reverseText(reply.reply_body),

                    // the group holder is reversed because when this string gets reversed, we need the holder
                    // to be $1
                    link = me.reverseText('<a target="_blank" href="https://sencha.jira.com/browse/1$">1$</a>');

                // wrap remaining URL matches in anchor tag
                text = text.replace(me.jiraRe, link);

                reply.reply_body = me.reverseText(text);
            });

            return replies;
        }
    }
});
