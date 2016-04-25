/**
 * Control for setting the credits field to 0
 */
Ext.define('Override.view.ticket.view.DetailsController', {
    override: 'Portal.view.ticket.view.DetailsController',

    control: {
        'portal-ticket-view-details #credits-refund': {
            click: 'refundCredits'
        }
    },

    refundCredits: function () {
        var creditsField = this.getView().down('#xcredits');
        creditsField.setValue(0);
    }
});

/**
 * Add a "refund" button next to the Credits field
 */
Ext.define('Override.view.ticket.view.Details', {
    override: 'Portal.view.ticket.view.Details',

    constructor: function (config) {
        var me = this,
            items = me.adminItems,
            field, fieldPos;

        field = Ext.Array.findBy(items, function (item, index) {
            if (item.name == 'xcredits') {
                fieldPos = index;
                return true;
            }
        });

        if (field) {
            field = {
                xtype:  'container',
                layout: {
                    type:  'hbox',
                    align: 'end'
                },
                items:  [{
                    xtype:      'numberfield',
                    itemId:     'xcredits',
                    fieldLabel: '{{Credits_Used}{Credits Used}}',
                    minValue:   0,
                    name:       'xcredits',
                    bind:       '{record.xcredits}',
                    flex:       1
                }, {
                    xtype:   'button',
                    itemId:  'credits-refund',
                    iconCls: 'x-fa fa-reply',
                    ui:      'blue-button',
                    tooltip: 'Refund Credits'
                }]
            };

            items[fieldPos] = field;
        }
        me.adminItems = items;

        me.callParent([config]);
    }
});

/**
 * Gets the value of the refund checkbox and passes it to the 'newjira' event
 */
Ext.define('Override.view.jira.AddController', {
   override: 'Portal.view.jira.AddController',

    onAdd : function() {
        var me   = this,
            win  = me.getView(),
            form = win.lookupReference('jira_form'),
            values;

        if (form.isValid()) {
            values = form.getValues();

            values.id = Ext.String.trim(values.id);

            win.setShowLoading('{{Checking_Jira_Mask}{Checking Jira issue...}}');

            JiraAction.getIssue(values.id, function(data) {
                if (data.success) {
                    me.doAdd(values.id, values.creditsrefund);
                } else {
                    win.setShowLoading(null);

                    Ext.Msg.alert(
                        '{{Jira_Not_Found_Title}{Not Found}}',
                        '{{Jira_Not_Found_Body}{That JIRA issue was not found.}}'
                    );
                }
            });
        }
    },

    doAdd : function(issue, refund) {
        var me  = this,
            win = me.getView(),
            tid = win.getTid();

        win.setShowLoading('{{Add_Jira_Mask}{Adding Jira issue to ticket...}}');

        PortalAction.addJiraToTicket(tid, issue, function(data) {
            if (data.success) {
                win.fireEvent('newjira', win, data, refund);

                win.close();
            } else {
                win.setShowLoading(null);

                Ext.Msg.alert(
                    '{{Add_Jira_Failed_Title}{Failed}}',
                    data.msg || '{{Add_Jira_Failed_Body}{Could not add that Jira issue to the ticket.}}'
                );
            }
        });
    }
});

/**
 * Add the refund checkbox to the Jira modal window
 */
Ext.define('Override.view.jira.Add', {
    override: 'Portal.view.jira.Add',
    items:    [
        {
            xtype:       'sencha-abstracts-form',
            reference:   'jira_form',
            bodyPadding: 5,
            items:       [
                {
                    xtype:      'textfield',
                    fieldLabel: '{{Jira_ID}{Jira ID}}',
                    itemId:     'jiraId',
                    name:       'id',
                    anchor:     '100%',
                    allowBlank: false,
                    listeners:  {
                        specialkey: 'onKey'
                    }
                }, {
                    xtype:      'checkbox',
                    fieldLabel: 'Refund Credits',
                    name:       'creditsrefund',
                    labelAlign: 'left'
                }
            ],
            buttons:     [
                {
                    text:     '{{Add}{Add}}',
                    ui:       'blue-button',
                    formBind: true,
                    handler:  'onAdd'
                }
            ]
        }
    ]
});

/**
 * Processes the refund if checked
 */
Ext.define('Portal.view.ticket.view.JiraFieldSetController', {
    override: 'Portal.view.ticket.view.JiraFieldSetController',

    onNewJira: function (win, response, doRefund) {
        var me = this,
            ticketDetailsCtrl = me.getView().up('portal-ticket-view-details').getController();

        me.callParent([win, response]);

        if (doRefund) {
            ticketDetailsCtrl.refundCredits();
            ticketDetailsCtrl.save();
        }
    }
});
