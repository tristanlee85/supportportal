Ext.define('Customization.view.TestConfigurator', {
    extend: 'Customization.view.Configurator',


    defaultType: 'textfield',
    items: [{
        name:       'field1',
        fieldLabel: 'Field 1',
        allowBlank: false
    }, {
        name:       'field2',
        fieldLabel: 'Field 2'
    }, {
        name:       'field3',
        fieldLabel: 'Field 3'
    }]
});
