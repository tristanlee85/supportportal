Ext.define('Override.view.ticket.TicketContainerController', {
    override: 'Portal.view.ticket.TicketContainerController',
    
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
            button, config, buffer, field;
        me.callParent();
    
        config = Customization.util.Config.getConfiguration('reply-draft');
        buffer = Ext.Number.from(config.saveKeystrokeBuffer);
        field = me.lookup('reply_textarea');

        button = me.down('[reference=submitButton]');
        button.actionMenu.splice(0, 0, {
            text:    'Save Reply as Draft',
            handler: function () {
                this.lookupReferenceHolder().getView().fireEvent('savedraft');
            }
        });
        
        // only enable keystroke monitoring if a buffer is defined
        if (buffer > 0) {
            field.relayEvents(field.down('textarea'), ['keypress'], 'field');
        }
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

    init: function () {
        var config = Customization.util.Config.getConfiguration('reply-draft'),
            buffer = Ext.Number.from(config.saveKeystrokeBuffer);
        
        this.control({
            'portal-ticket-form-reply': {
                replyexpand: function () {
                    var me = this,
                        hasDraft = me.restoreDraft();
                    me.clearDraft();
                },
                
                // clear the saved draft after a successful form action
                actioncomplete: 'clearDraft'
            },
        
            'sencha-abstracts-field-bbcode': {
                savedraft: 'handleSaveDraft',
                fieldkeypress: {
                    buffer: buffer,
                    fn: 'saveDraft'
                }
            }
        });
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

Ext.define('Customization.view.replydraft.Configurator', {
    extend: 'Customization.view.Configurator',
    
    viewModel: {
        data: {
            saveBuffer: 0,
            desc: [ 'Save buffer is used to automatically save the reply draft',
                    'as you type. Rather than saving on each keystroke, it\'s',
                    'ideal to buffer the call when you feel it\'s necessary to',
                    'save. To disable the auto-save functionality, set the value',
                    'to 0. You may optionally save the draft manually from the',
                    'Submit button menu'].join(' ')
        }
    },
    
    items: [{
        xtype: 'fieldset',
        title: 'Auto-save Draft Buffer',
    
        layout: {
            type:  'vbox',
            align: 'stretch'
        },
        items:  [{
            bind: {
                html: '{desc}'
            }}, {
            xtype:      'numberfield',
            name:       'saveKeystrokeBuffer',
            fieldLabel: 'Buffer (ms)',
            labelAlign: 'left',
            minValue: 0,
            bind:       {
                value: '{saveBuffer}'
            }
        }]
    }]
});
