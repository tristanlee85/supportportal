(function () {
    var runner = new Ext.util.TaskRunner(),
        interval = 30 * (1000 * 60),
        initialVersion = window.portalExtensionVersion,
        task;

    if (Ext.isString(initialVersion)) {
        initialVersion = new Ext.Version(initialVersion);
    }

    // This task requests the contents of the extension manifest
    // to extract the version. We must read the manifest directly
    // because once the extension is updated, the chrome.runtime
    // context is no longer valid until the tab is reloaded.
    task = runner.newTask({
        run:      function () {
            task.stop();

            Messenger.sendMessage('getUpdateInfo', null, function (response) {
                var result = response.actionResult;
                if (response.success && initialVersion.lt(result.version) && result.isActiveTab) {
                    Ext.Msg.show({
                        title: 'Support Portal Customizations Update Available',
                        message: new Ext.XTemplate([
                            '<p>The Support Portal Customizations extension has been automatically updated. ',
                            'The following are changes to the release:</p>',
                            '<tpl for="fixes">',
                                '<li><span style="color: red; font-weight: bold;">[Fixed]</span>: {.}</li>',
                            '</tpl>',
                            '<tpl for="features">',
                                '<li><span style="color: green; font-weight: bold;">[Feature]</span> {.}</li>',
                            '</tpl>',
                            '<tpl if="!fixes.length && !features.length">',
                                '<li>Minor stability updates</li>',
                            '</tpl>',
                            '<p>In order for the updates to be available, the application needs to reload.',
                            'Only tabs using the Support Portal will be reloaded</p>'
                        ]).apply(result.changelog),
                        width: 500,
                        buttons: Ext.Msg.YESNOCANCEL,
                        buttonText: {
                            'yes': '<b>Reload tab(s) now</b>',
                            'no': 'Remind me later',
                            'cancel': 'Ignore'
                        },
                        icon: Ext.Msg.INFO,
                        closable: false,
                        fn: function (button) {
                            switch (button) {
                                case 'yes':
                                    Messenger.sendMessage('reloadTabs');
                                    break;
                                case 'no':
                                    task.start();
                            }
                        }
                    });
                } else {
                    task.start();
                }
            });
        },
        interval: interval
    });

    task.start();
}());
