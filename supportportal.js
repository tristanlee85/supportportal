// ==UserScript==
// @name         SenchaPortal
// @namespace    SenchaPortal
// @version      0.11
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
        // Ext.isReady may be too late in some cases so we base
        // it on when we're able to call define()
        if (Ext.define) {

            /**
             * BUG FIX (PORTAL-447)
             *
             * Fixes issue where the ticket view scroll position jumps
             * when attempting to select text
             */
            Ext.define('override.grid.NavigationModel', {
                override: 'Ext.grid.NavigationModel',

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
                override: 'Ext.grid.feature.RowBody',

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
             * BUG FIX (PORTAL-485, PORTAL-489)
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
             * IMPROVEMENT (PORTAL-491)
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

            /**
             * BUG FIX (PORTAL-482)
             *
             * Fixes issue with the Expand All button collapsing any already-expanded
             * replies.
             *
             * This override can't be applied until the portal's override is applied.
             * We'll loop until we see that the parent override is applied then apply
             * this one.
             */
            var portal482 = setInterval(function () {
                if (Ext.ClassManager.overrideMap['Override.grid.plugin.RowExpander']) {
                    Ext.define('override.grid.plugin.RowExpander', {
                        override: 'Ext.grid.plugin.RowExpander',

                        expandAll: function () {
                            var me = this,
                                records = me.recordsExpanded,
                                grid = me.grid,
                                store = grid.getStore();
                            if (store && store.getCount()) {
                                store.each(function (record, idx) {
                                    // don't toggle rows already expanded
                                    if (!records[record.internalId]) {
                                        me.toggleRow(idx, record);
                                    }
                                });
                            }
                            return this;
                        }
                    });

                    clearInterval(portal482);
                }
            }, 10);

            /* ************************************************************************ */

            /**
             * TODO
             * BUG FIX (PORTAL-468)
             *
             * When submitting a ticket reply that fails (usually upload is too large),
             * the load mask is not removed. There's no way to handle the failure
             * currently. EXTJS-5762 will provide a fix to ensure that either the
             * request failure callback is invoked and/or at the very least the
             * 'exception' event is fired from the direct manager so that we can manually
             * remove the mask.
             */

            /* ************************************************************************ */

            /**
             * IMPROVEMENT (PORTAL-466)
             *
             * Enable text selection in the panel header
             */
            Ext.define('override.panel.Header', {
                override: 'Ext.panel.Header',

                beforeRender: function () {
                    var me = this,
                        itemPosition = me.itemPosition;

                    me.callSuper();

                    if (itemPosition !== undefined) {
                        me.insert(itemPosition, me._userItems);
                    }
                }
            });

            /* ************************************************************************ */

            /**
             * IMPROVEMENT
             *
             * Adds ticket number as a link in the info section
             */
            Ext.define('override.view.ticket.view.Info', {
                override: 'Portal.view.ticket.view.Info',

                cachedConfig: {
                    tpl: [
                             '<tpl exec="this.isCollapsed = this.getFromScope(\'collapsed\')"></tpl>',
                             '<div class="header">',
                             'Ticket Info: <a href="#ticket-{tid}">{tid}</a>',
                             '<div class="collapse x-fa fa-chevron-up<tpl if="this.isCollapsed"> ',
                             Ext.baseCSSPrefix,
                             'hidden-display</tpl>" ext:action="collapse" data-qtip="Collapse ticket info"></div>',
                             '<div class="expand x-fa fa-chevron-down<tpl if="!this.isCollapsed"> ',
                             Ext.baseCSSPrefix, 'hidden-display</tpl>" ext:action="expand" data-qtip="Expand ticket info"></div>',
                             '</div>',
                             '<div class="body">',
                             '<div class="row">',
                             '<div><b>Opened By:</b> {[this.linkify(values.display_name, "popup-user-" + values.uid)]}</div>',
                             '<div><b>Subscription:</b> {subscription_description}</div>',
                             '</div>',
                             '<div class="row bottom-border">',
                             '<div><b>Open Date:</b> {open_date:date("M j `y, g:ia")}</div>',
                             '<div><b>Company:</b> {[this.linkify(values.company, "popup-subscription-" + values.sid, true)]}</div>',
                             '</div>',
                             '<tpl if="Sencha.User.isAdmin()">',
                             '<div class="row top-border">',
                             '<div><b>Assigned To:</b> {[this.linkify(values.owner_display_name, "popup-user-" + values.owner)]}</div>',
                             '<div><b>Status Detail:</b> {status_detail}</div>',
                             '</div>',
                             '<div class="row">',
                             '<div><b>Minutes Worked:</b> {total_minutes_worked:pluralize("min", "mins", "0,0")}</div>',
                             '<div><b>Tier:</b> {tier}</div>',
                             '</div>',
                             '<div class="row bottom-border">',
                             '<div><b>Override Provided:</b> {[values.override ? "Yes" : "No"]}</div>',
                             '<div><b>Reason:</b> {reason}</div>',
                             '</div>',
                             '</tpl>',
                             '<div class="row top-border">',
                             '<div><b>Ticket Type:</b> {ticket_type_text}</div>',
                             '<div><b>Platforms:</b> {[values.platforms && values.platforms.length ? values.platforms.map(function(platform) { return platform.text; }).join(", ") : "None"]}</div>',
                             '</div>',
                             '<div class="row">',
                             '<div><b>Credits Used:</b> {xcredits} (of {subscription_available_credits:number("0,0")} available)</div>',
                             '<div><b>Browsers:</b> {[values.browsers && values.browsers.length ? values.browsers.map(function(browser) { return browser.text; }).join(", ") : "None"]}</div>',
                             '</div>',
                             '<div class="row">',
                             '<div><b>Product:</b> {product_name} {product_version}</div>',
                             '<div><b>Sencha Architect:</b> {[values.product_architect ? "Yes" : "No"]}</div>',
                             '<div class="edit x-fa fa-pencil" ext:action="edit" data-qtip="Edit ticket info"></div>',
                             '</div>',
                             '</div>'
                         ].join('')
                }
            });

            /* ************************************************************************ */

            /**
             * IMPROVEMENT
             *
             * Loading the grid defaults to filtering tickets based on the
             * logged-in user
             */
            Ext.define('override.view.ticket.Grid', {
                override: 'Portal.view.ticket.Grid',

                constructor: function (config) {
                    this.config.filters.owner = {
                        operator: "=",
                        property: "owner",
                        root:     "data",
                        value:    Sencha.User.get('uid')
                    };

                    this.callParent([config]);
                }
            });

            /* ************************************************************************ */

            /**
             * IMPROVEMENT
             *
             * Automatically collapse the west menu based on its previous state.
             * This isn't based on the collapsed state due to how the width and
             * classes are applied so it will be expanded when the application
             * first loads and then automatically collapse.
             */
            Ext.define('override.view.main.West', {
                override: 'Portal.view.main.West',

                stateId: 'west-menu',

                constructor: function (config) {
                    var me = this;

                    me.callParent([config]);

                    if (me.getState().width === me.collapsedWidth) {
                        me.on('render', me.collapse, me);
                    }
                }
            });

            /* ************************************************************************ */

            /**
             * FEATURE
             *
             * Adds the ability to save a reply as a draft
             */
            Ext.define('override.window.MessageBox', {
                override: 'Ext.window.MessageBox',

                // Allows for passing 'buttons' config as an Object hash
                updateButtonText: function () {
                    var me = this,
                        buttonText = me.buttonText,
                        buttons = 0,
                        btnId,
                        btn;

                    for (btnId in buttonText) {
                        if (buttonText.hasOwnProperty(btnId)) {
                            btn = me.msgButtons[btnId];
                            if (btn) {

                                if (me.cfg && me.cfg.buttons && Ext.isObject(me.cfg.buttons)) {
                                    buttons = buttons | Math.pow(2, Ext.Array.indexOf(me.buttonIds, btnId));
                                }

                                if (btn.text !== buttonText[btnId]) {
                                    btn.setText(buttonText[btnId]);
                                }
                            }
                        }
                    }
                    return buttons;
                }
            });

            Ext.define('override.view.ticket.view.form.Reply', {
                override: 'Portal.view.ticket.view.form.Reply',

                constructor: function (config) {
                    var me = this;

                    me.items[0].bottomToolbar.adminItems.splice(1, 0, {
                        hidden:    true,
                        html:      'Draft restored',
                        xtype:     'component',
                        reference: 'draftAlert',
                        cls:       'draft-alert'
                    });

                    me.callParent([config]);
                },

                expand: function () {
                    var me = this;
                    me.callParent(arguments);
                    me.fireEvent('replyexpand', me);
                }
            });

            Ext.define('override.view.ticket.view.form.ReplyController', {
                override: 'Portal.view.ticket.view.form.ReplyController',

                control: {
                    'portal-ticket-view-form-reply': {
                        replyexpand: function () {
                            var hasDraft = this.restoreDraft(),
                                form = this.getView(),
                                toolbar = form.down('[bottomToolbar]'),
                                draftNotice = toolbar.lookupReference('draftAlert');

                            this.clearDraft();

                            if (hasDraft) {
                                draftNotice.setHidden(false);
                                draftNotice.getEl().highlight().fadeOut();
                            }
                        }
                    }
                },

                reset: function () {
                    var me = this,
                        form = this.getView();
                    if (form.isDirty()) {
                        this.dirtyPrompt(function (button) {
                            // save the reply as a draft
                            if (button === 'cancel') {
                                me.saveDraft();
                                button = 'yes';
                            }

                            if (button === 'yes') {
                                form.collapse(form.reset, form);
                            }
                        });
                    } else {
                        form.collapse(form.reset, form);
                    }
                },

                dirtyPrompt: function (callback, scope) {
                    var msg = Ext.Msg;
                    scope = scope || this;

                    msg.show({
                        title:   '{{Continue_Question}{Continue?}}',
                        message: '{{Unsaved_Changes_Cancel}{There are unsaved changes which will be lost. Are you sure you want to cancel?}}',
                        buttons: {
                            yes:    msg.buttonText.yes,
                            no:     msg.buttonText.no,
                            cancel: 'Save as Draft'
                        },

                        fn: function (button) {
                            if (button === 'yes') {
                                Sencha.util.General.clearDirty();
                            }
                            callback.call(scope, button);
                        }
                    });
                },

                getStorage: function () {
                    return Ext.util.LocalStorage.get('ticket-draft');
                },

                getDraftInfo: function () {
                    var form = this.getView();

                    return {
                        form:     form,
                        field:    form.down('textarea'),
                        storage:  this.getStorage(),
                        ticketId: form.getTid()
                    };
                },

                saveDraft: function () {
                    var info = this.getDraftInfo(),
                        value = info.field.getValue();

                    info.storage.setItem(info.ticketId, value);
                    info.storage.release();
                },

                restoreDraft: function () {
                    var info = this.getDraftInfo(),
                        draft = info.storage.getItem(info.ticketId);

                    info.field.setValue(draft || null);
                    info.storage.release();

                    return draft !== null;
                },

                clearDraft: function () {
                    var info = this.getDraftInfo();

                    info.storage.removeItem(info.ticketId);
                    info.storage.release();
                }
            });

            /* ************************************************************************ */

            /* ***************** Place additional fixes above ***************** */
            /* **************************************************************** */
            window.console && console.info && console.info('Portal fixes applied');
            clearInterval(interval);
        }
    }, 10);
})();
