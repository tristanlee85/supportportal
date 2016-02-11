// ==UserScript==
// @name         SenchaPortal
// @namespace    SenchaPortal
// @version      0.6
// @description  Contains temporary fixes to be applied to the portal
// @author       Tristan Lee
// @match        https://test-support.sencha.com
// @grant        none
// ==/UserScript==

(function () {
    window.Ext = Ext || {};

    // because of when the scripts are executed by the extension, we must
    // check to see if the framework is available before applying
    var interval = setInterval(function () {
        if (Ext.define) {

            /**
             * BUG FIX
             *
             * Fixes issue where the ticket view scroll position jumps
             * when attempting to select text
             */
            Ext.define('override.grid.NavigationModel', {
                override:        'Ext.grid.NavigationModel',
                onItemMouseDown: function (view, record, item, index, mousedownEvent) {
                    var me = this;
                    // If the event is a touchstart, leave it until the click to focus
                    // A mousedown outside a cell. Must be in a Feature, or on a row border
                    if (!mousedownEvent.position.cellElement && (mousedownEvent.pointerType !== 'touch')) {
                        // Stamp the closest cell into the event as if it were a cellmousedown
                        me.getClosestCell(mousedownEvent);
                        // If we are not already on that position, set position there.
                        if (!me.position.isEqual(mousedownEvent.position)) {
                            me.setPosition(mousedownEvent.position, null, mousedownEvent);
                        }
                        // If the browser autoscrolled to bring the cell into focus
                        // undo that.
                        view.getScrollable().restoreState();
                    }
                }
            });
            Ext.define('override.grid.feature.RowBody', {
                override:      'Ext.grid.feature.RowBody',
                innerSelector: '.' + Ext.baseCSSPrefix + 'grid-rowbody'
            });

            /* ************************************************************************ */

            /**
             * BUG FIX
             *
             * Fixes issue where creating a hyperlink from selected text
             * does not always display the prompt for supplying the URL
             */
            Ext.define('override.view.abstracts.field.BBCodeController', {
                override: 'Sencha.view.abstracts.field.BBCodeController',

                handleLink: function (button) {
                    var me = this,
                        info = me.getWrapInfo(button),
                        urlRe = me.urlRe,
                        selection = info.value.substring(info.pos.start, info.pos.end);

                    // we want to test the RE based on the selection, not the entire value
                    if (urlRe.test(selection)) {
                        me.wrapText(info);
                    } else {
                        //TODO i18n
                        Ext.Msg.prompt('Provide URL', 'Please provide a URL for this link', function (btn, text) {
                            if (btn === 'ok' && urlRe.test(text)) {
                                //delay it in case the user pressed ENTER. seems this adds a linebreak
                                setTimeout(function () {
                                    info.attr = '"' + text + '"';
                                    me.wrapText(info);
                                }, 0);
                            }
                        });
                    }
                }
            });

            /* ************************************************************************ */

            /**
             * IMPROVEMENT
             *
             * Automatically parses links based on the raw text. This will no
             * longer be needed once everyone uses Portal 2 since it parses
             * everything on the server. For now, this will help for customers
             * still using the old portal. This also fixes issues with the original
             * links being parsed incorrectly as the regex in Sencha.view.abstracts.field.BBCodeController
             * is too forgiving about its URL pattern and will match class names.
             *
             * BUG FIX
             *
             * List item text that contains BB code gets incorrectly parsed on the server and
             * causes the <li> to be prematurely closed.
             */
            Ext.define('override.view.ticket.GridController', {
                override: 'Portal.view.ticket.GridController',

                // matches URLs except those otherwise wrapped in a tag
                urlRe: /(https?:\/\/(?:w{1,3}.)?[^\s]*?(?:\.[a-z0-9/?!@#$=]+)+)(?![^<]*?(?:<\/\w+>|\/?>))/gi,

                // matches the incorrect list parsing when BB code is used within list items
                listRe: /(<li>.*?)(<\/li>)(.*?)<br>(?=<(li|\/ul)>)/gi,

                loadTicket: function (grid, dock, tid) {
                    var me = this;
                    if (dock || grid.getStore().isLoaded()) {
                        grid.setShowLoading('{{Loading_Ticket_mask}{Loading ticket...}}');
                    }
                    PortalAction.getTicket(tid, function (result) {
                        grid.setShowLoading(null);
                        if (result.success) {
                            var ticket = result.data,
                                replies = ticket.replies ? Ext.Array.clone(ticket.replies) : [],
                                width = grid.getWidth() - 300,
                            //300 is width of ticket grid
                                reply = grid.getReply(),
                                subscribe;
                            ticket.last_post_time = Ext.Date.parse(ticket.last_post_time, 'c');
                            ticket.open_date = Ext.Date.parse(ticket.open_date, 'c');
                            grid.suspendLayouts();
                            replies.unshift({
                                attachment_id:        ticket.attachment_id,
                                attachment_mime_type: ticket.attachment_mime_type,
                                attachment_name:      ticket.attachment_name,
                                display_name:         ticket.display_name,
                                notes:                ticket.notes ? Ext.Array.clone(ticket.notes) : null,
                                reply_body:           ticket.description,
                                raw_body:             ticket.raw_text,
                                receive_email:        ticket.receive_email,
                                renew_date:           ticket.renew_date,
                                reply_date:           ticket.open_date,
                                tid:                  ticket.tid,
                                uid:                  ticket.uid
                            });

                            Ext.Array.forEach(replies, function (reply, index, replies) {
                                var text = reply.reply_body;

                                // wrap remaining URL matches in anchor tag
                                text = text.replace(me.urlRe, '<a target="_blank" href="$1">$1</a>');

                                // replace rogue </li> at correct position
                                text = text.replace(me.listRe, '$1$3</li>');

                                reply.reply_body = text;
                            });

                            if (dock) {
                                dock.setTicket(ticket);
                                dock.getStore().loadData(replies);
                                dock.reply = reply;
                                dock.updateReply(reply);
                            } else {
                                dock = grid.ticketDock = new Portal.view.ticket.View({
                                    dock:      'right',
                                    width:     width,
                                    margin:    '0 0 0 10',
                                    reply:     reply,
                                    ticket:    ticket,
                                    resizable: {
                                        handles: 'w'
                                    },
                                    store:     {
                                        model: 'Portal.model.ticket.Reply',
                                        data:  replies
                                    }
                                });
                                grid.addDocked(dock);
                            }
                            grid.getSelectionModel().getNumbererColumn().hide();
                            dock.lookupReference('ticketDetails').update(ticket);
                            grid.cacheColumns();
                            grid.reconfigure(null, [
                                grid.collapsedColumn
                            ]);
                            grid.resumeLayouts(true);
                            subscribe = dock.lookupReference('subscribeField');
                            subscribe.suspendEvents(false);
                            subscribe.setValue(ticket.subscribed);
                            subscribe.resumeEvents(true);
                        } else {
                            Ext.Msg.alert('{{Ticket_Not_Found_Title}{Ticket Not Found}}', result.msg || '{{Ticket_Not_Found_Body}{That ticket was not found. You will be returned to the ticket grid.}}', function () {
                                me.redirectTo('ticket');
                            });
                        }
                    });
                }
            });

            /* ************************************************************************ */

            /**
             * IMPROVEMENT
             *
             * Forces the minimum value of the Credits Used field to be 0. Otherwise,
             * it's possible to apply negative credits to a ticket and skew the output,
             * perhaps even give more credits than the purchased depending on how the
             * server handles this value.
             */
            Ext.define('override.view.ticket.view.form.Edit', {
                override: 'Portal.view.ticket.view.form.Edit',

                initComponent: function () {
                    var me = this;

                    me.callParent(arguments);
                    me.lookupReference('ticket_form').down('[name=xcredits]').setMinValue(0);
                }
            });

            /* ************************************************************************ */

            /**
             * IMPROVEMENT
             *
             * Preserves the scroll position of the ticket grid during refresh
             */
            Ext.define('override.view.ticket.Grid', {
                override: 'Portal.view.ticket.Grid',

                constructor: function (config) {
                    Ext.apply(this.viewConfig, {
                        preserveScrollOnReload: true
                    });
                    this.callParent(arguments);
                }
            });

            /* ************************************************************************ */

            /* ***************** Place additional fixes above ***************** */
            /* **************************************************************** */
            window.console && console.info && console.info('Portal fixes applied');
            clearInterval(interval);
        }
    }, 100);
})();
