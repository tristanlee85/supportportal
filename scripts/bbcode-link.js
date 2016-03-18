Ext.define('Override.view.abstracts.field.BBCodeController', {
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
