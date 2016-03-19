Ext.define('Override.view.ticket.TicketContainerController', {
    override:        'Portal.view.ticket.TicketContainerController',
    showTicketReply: function (origin, config) {
        var view = this.getView(),
            replyForm = view.getReplyForm(),
            value = config.value || '';
        if (replyForm) {
            // I'm not sure why the need to expand here when it's done below too.
            // This causes 2 events to fire.
            /*if (replyForm.isComponent) {
             replyForm.expand();
             } else {
             view.setReplyForm(replyForm = Ext.create(replyForm));
             }*/
            if (!replyForm.isComponent) {
                view.setReplyForm(replyForm = Ext.create(replyForm));
            }

            if (replyForm.ownerCt !== view) {
                view.add(replyForm);
            }
        }
        if (!Ext.isDefined(config.rid)) {
            config.rid = null;
        }
        if (!Ext.isDefined(config.nid)) {
            config.nid = null;
        }
        replyForm.setConfig(config);
        replyForm.expand();
        replyForm.lookup('reply_textarea').setValue(value);
    }
});

Ext.define('Override.view.ticket.form.Reply', {
    override: 'Portal.view.ticket.form.Reply',

    constructor: function (config) {
        var me = this;

        me.items[0].bottomToolbar.adminItems.splice(1, 0, {
            hidden:    true,
            hideMode:  'visibility',
            html:      null,
            xtype:     'component',
            reference: 'draftAlert',
            cls:       'draft-alert',
            flex:      1
        });

        me.callParent([config]);
    },

    expand: function () {
        var me = this;
        me.callParent(arguments);

        if (me.mode && me.mode === 'reply') {
            me.fireEvent('replyexpand', me);
        }
    }
});

Ext.define('Override.view.ticket.form.ReplyController', {
    override: 'Portal.view.ticket.form.ReplyController',

    control: {
        'portal-ticket-form-reply': {
            replyexpand: function () {
                var me = this,
                    hasDraft = me.restoreDraft();
                me.clearDraft();

                if (hasDraft) {
                    me.draftNotice('Draft not saved', 'warn', true);
                }
            },

            draftsaved: function () {
                this.draftNotice('Draft saved', 'info');
            },

            formsubmit: function () {
                this.clearDraft();
            }
        },

        'portal-ticket-form-reply sencha-abstracts-field-textarea': {
            keypress: {
                // save the draft if a key hasn't been pressed after 5 seconds
                buffer: 5000,
                fn:     function () {
                    var me = this;
                    me.saveDraft();
                }
            }
        }
    },

    submit: function (options) {
        var me = this,
            form = me.getView();

        me.callParent([options]);

        if (form.isValid()) {
            form.fireEvent('formsubmit', me);
        }

    },

    draftNotice: function (text, type, keep) {
        var form = this.getView(),
            toolbar = form.down('[bottomToolbar]'),
            draftNotice = toolbar.lookupReference('draftAlert'),
            el = draftNotice.getEl(),
            textCfg = {
                info: {icon: 'x-fa fa-info-circle'},
                warn: {icon: 'x-fa fa-exclamation-circle', color: 'ff9e9e'}
            };

        el.setHtml(Ext.String.format('<span class="{1}">{0}</span>', text, textCfg[type].icon));
        draftNotice.setHidden(false);
        el.highlight(textCfg[type].color || null);
        if (keep !== true) {
            el.slideOut('r', {delay: 1500});
        }
    },

    getStorage: function () {
        return Ext.util.LocalStorage.get('ticket-draft');
    },

    getDraftInfo: function () {
        var form = this.getView(),
            ticketContainer = form.up('portal-ticket-ticketcontainer'),
            vm = ticketContainer.getViewModel();

        return {
            form:     form,
            field:    form.down('textarea'),
            storage:  this.getStorage(),
            ticketId: vm.get('tid')
        };
    },

    saveDraft: function () {
        var info = this.getDraftInfo(),
            value = info.field.getValue();

        info.storage.setItem(info.ticketId, value);
        info.storage.release();

        this.getView().fireEvent('draftsaved', this);
    },

    restoreDraft: function () {
        var info = this.getDraftInfo(),
            draft = info.storage.getItem(info.ticketId);

        Ext.defer(function () {
            info.field.setValue(draft || null);
        }, 50);
        info.storage.release();

        return draft !== null;
    },

    clearDraft: function () {
        var info = this.getDraftInfo();

        info.storage.removeItem(info.ticketId);
        info.storage.release();
    }
});
