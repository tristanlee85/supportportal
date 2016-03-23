Ext.define('Customization.util.Config', {
    singleton: true,

    configName: 'config',

    getStorage: function () {
        return Ext.util.LocalStorage.get('portal-customizations');
    },

    isConfigEnabled: function (id) {
        return this.getStorage().getItem(id) === 'true';
    },

    getConfigItemName: function (id) {
        return Ext.String.format('{0}-{1}', id, this.configName);
    },

    getConfiguration: function (id) {
        return this.decodeValue(this.getStorage().getItem(this.getConfigItemName(id)));
    },

    setConfiguration: function (id, value) {
        this.getStorage().setItem(this.getConfigItemName(id), this.encodeValue(value));
    },

    // pulling these right from the Provider prototype since they can be
    // invoked in a static context
    privates: {
        encodeValue: Ext.state.Provider.prototype.encodeValue,
        decodeValue: Ext.state.Provider.prototype.decodeValue
    }
});
