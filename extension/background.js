/**
 * This conditions the extension to only appear activated for the hosts listed
 * below. The icon will be in a disabled state when the active tab does not
 * match.
 */
chrome.runtime.onInstalled.addListener(function () {
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function () {
        chrome.declarativeContent.onPageChanged.addRules([{
            conditions: ['support.sencha.com', 'test-support.sencha.com'].map(function (host) {
                return new chrome.declarativeContent.PageStateMatcher({pageUrl: {hostEquals: host}});
            }),
            actions:    [new chrome.declarativeContent.ShowPageAction()]
        }]);
    });
});

/**
 * This adds a listeners for receiving any messages from the content script.
 * Because this background script runs without the extension being active
 * on the application, we need to wait for the application to message us and
 * tell us what version of the script that are using. It's possible that the
 * application is already loaded when a new version of the extension is
 * updated. We'll use this to compare the last known version of the extension
 * used by the application against that of the manifest to determine if an
 * tab reload is necessary.
 */
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    console.info('onMessage listener has received a request from the application');
    var
        storage = chrome.storage.local,
        activeVersion;

    if (request.version) {
        activeVersion = request.version;

        console.info('Application gave us its current version. Setting active version to ', activeVersion);
        // store the latest active version to be referenced later
        storage.set({activeExtensionVersion: activeVersion});
    }
});

/**
 * Immediate function that starts the check process. First, we start an interval
 * that indefinitely checks for a difference between the version listed in the
 * extension manifest and that which was last reported by the application.
 *
 * If the versions are the same, the process is cancelled and won't be started
 * again until the extension updates. If the application version is older, then
 * we'll query for all the tabs that are actively using the Support Portal. A
 * notification is then displayed to the user and continues to display at the
 * defined interval period until the user either chooses to reload the tabs
 * or ignore the notification. In either case, the notification process is then
 * stopped. If the user chose to reload the tabs, then all related tabs get
 * reloaded. The process will not start again until the extension gets updated.
 */
(function () {
    var
        /**
         * Interval for checking to see if a new update is available
         * @type {number} Defaults to 5 minutes
         */
        intervalPeriod = 5 * (1000 * 60),

        /**
         * Chrome's extension local storage
         * @type {StorageArea}
         */
        storage = chrome.storage.local,

        /**
         * Id of the notification
         * @type {string}
         */
        notificationId = 'support-portal-update',

        /**
         * Relative path to the JSON changelog
         * @type {string}
         */
        changelogPath = 'script/changelog.json',

        /**
         * Config options for the notification
         * @type {{type: string, title: string, message: string, iconUrl: string, items: Array, buttons: *[], priority: number}}
         */
        opt = {
            type:     "list",
            title:    "Support Portal Customizations - Update Available",
            message:  "An update is available which addresses the following items:",
            iconUrl:  "logo_128.png",
            items:    [],
            buttons:  [{
                title: 'Ignore Notification'
            }, {
                title: 'Refresh Application'
            }],
            priority: 1
        },

        /**
         * Compares versions to determine if the application is running an older version
         * @param a Version the application last used
         * @param b Current version of the extension
         * @returns {boolean} `true` if the application's last version is behind the extension version
         */
        hasOlderVersion = function (a, b) {
            var i, cmp, len, re = /(\.0)+[^\.]*$/;
            a = (a + '').replace(re, '').split('.');
            b = (b + '').replace(re, '').split('.');
            len = Math.min(a.length, b.length);
            for (i = 0; i < len; i++) {
                cmp = parseInt(a[i], 10) - parseInt(b[i], 10);
                if (cmp !== 0) {
                    return cmp < 0;
                }
            }
            return (a.length - b.length) < 0;
        },

        /**
         * References the lastError key for when a function call fails. Referencing this
         * prevents the console from being polluted with any error messages.
         */
        silentErrorFn = function () {
            // reference the to prevent polluting the console
            chrome.runtime.lastError;
        },

        /**
         * Current version of the extension
         * @type {string}
         */
        currentVersion = chrome.runtime.getManifest().version,

        checkInterval, notificationInterval, activeVersion;

    // this interval constantly checks the loaded extension version to
    // that last reported by the application
    checkInterval = setInterval(function () {
        console.info('Checking for difference in extension versions...');
        var activeTabs;

        console.info('No application version is yet set; grabbing it from storage');
        storage.get('activeExtensionVersion', function (items) {
            activeVersion = items.activeExtensionVersion || 0;

            if (hasOlderVersion(activeVersion, currentVersion)) {
                console.info('An older version is being used; starting notification process');
                clearInterval(checkInterval);

                console.info('Querying for active tabs');
                chrome.tabs.query({url: '*://support.sencha.com/*'}, function (tabs) {
                    console.info('# of tabs found: ', tabs.length);
                    activeTabs = tabs;

                    // there's no active tabs open so just give them the ignore option
                    if (activeTabs.length === 0) {
                        opt.buttons.pop();
                    }

                    // Read in the changelog to parse out the fixes/features
                    chrome.runtime.getPackageDirectoryEntry(function (root) {
                        root.getFile(changelogPath, {}, function (fileEntry) {
                            fileEntry.file(function (file) {
                                var reader = new FileReader();
                                reader.onloadend = function (e) {
                                    var changes = {},
                                        items = [],
                                        i = 0,
                                        item, len;

                                    try {
                                        changes = JSON.parse(this.result);
                                    } catch (e) {
                                        console.error('Unable to parse contents from changelog.json', this.result);
                                    }

                                    if (changes.hasOwnProperty('fixes')) {
                                        item = changes['fixes'],
                                            len = item.length;
                                        for (; i < len; i++) {
                                            items.push({
                                                title:   'Fixed:',
                                                message: item[i]
                                            });
                                        }
                                    }

                                    if (changes.hasOwnProperty('features')) {
                                        item = changes['features'],
                                            len = item.length;
                                        for (; i < len; i++) {
                                            items.push({
                                                title:   'Feature:',
                                                message: item[i]
                                            });
                                        }
                                    }

                                    if (!items.length) {
                                        items.push({
                                            title: 'Update',
                                            message: 'Minor extension update'
                                        });
                                    }

                                    // add the list items to the notification options
                                    opt.items = items;

                                    console.info('Creating update notification');

                                    chrome.notifications.create(notificationId, opt);
                                    chrome.notifications.onButtonClicked.addListener(function (notificationId, buttonIdx) {
                                        // ignore future notifications for this version
                                        if (buttonIdx === 0) {
                                            console.info('Client requested to ignore the notification; cancelling');
                                            chrome.notifications.clear(notificationId);
                                            clearInterval(notificationInterval);
                                        } else {
                                            var reload = confirm('This will reload all tabs using the Support Portal. Are you sure?'),
                                                i = 0,
                                                len = activeTabs.length;
                                            if (reload) {
                                                console.info('Reloading all active tabs');
                                                for (; i < len; i++) {
                                                    chrome.tabs.reload(activeTabs[i].id, {bypassCache: false}, silentErrorFn);
                                                }
                                                console.info('Stopping notification process');
                                                clearInterval(notificationInterval);
                                            }
                                        }
                                    });

                                    // keep displaying the notification until action is taken
                                    notificationInterval = setInterval(function () {
                                        console.info('Follow-up notification created');
                                        chrome.notifications.create(notificationId, opt);
                                    }, intervalPeriod);
                                };
                                reader.readAsText(file);
                            }, silentErrorFn);
                        }, silentErrorFn);
                    });
                });
            } else {
                console.info('Versions are the same; cancelling check process');
                clearInterval(checkInterval);
            }
        });

    }, intervalPeriod);
}());
