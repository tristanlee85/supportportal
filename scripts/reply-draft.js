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

    initComponent: function () {
        var me = this,
            button;
        me.callParent();

        button = me.down('[reference=submitButton]');
        button.actionMenu.splice(0, 0, {
            text:    'Save Reply as Draft',
            handler: function () {
                this.lookupReferenceHolder().getView().fireEvent('savedraft');
            }
        });
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
            }
        },

        'sencha-abstracts-field-bbcode': {
            savedraft: 'handleSaveDraft'
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

    handleSaveDraft: function () {
        this.saveDraft();
        this.getView().collapse();
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
