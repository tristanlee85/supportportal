(function () {
    /**
     * Messenger contains the handler that's invoked when receiving a
     * message from the content script. Actions within the messenger
     * are used to process functionality only available from within the
     * background script. Some actions will simply return while others
     * may send a response back to the content script for further
     * processing.
     * @type {object}
     */
    var Messenger = {
        /**
         * Handles the validation and invocation of any messages received
         * from the content script.
         * @param request
         * @param sender
         * @param sendResponse
         */
        handleMessage: function (request, sender, sendResponse) {
            var action;

            console.info('onMessage listener has received a request from the application');

            if (!request.action || !request.action in Messenger.actions) {
                console.warn('Invalid action or no action specified: ', request.action);
                return;
            }

            action = Messenger.actions[request.action];
            return action.apply(this, [request, sender, sendResponse]);
        },

        /**
         * Gets all tabs that match the host of the Support Portal
         * @param callback Accepts 1 argument which is a Tab[]
         */
        getOpenPortalTabs: function (callback) {
            chrome.tabs.query({url: '*://support.sencha.com/*'}, callback);
        },

        /**
         * Injects the content script messenger to the specified tab
         */
        injectContentScriptMessenger: function (tabId) {
            chrome.tabs.executeScript(tabId, {
                file: 'js/jquery-2.0.3.min.js'
            }, function () {
                /**
                 * This function is the main messenger for the content script. However,
                 * whenever the extension is updated, any existing connections between
                 * the extension and content script are closed. The avoid that and
                 * prevent the need from reloading all the tabs, we dynamically inject
                 * this function into the content script and execute it.
                 * */
                chrome.tabs.executeScript(tabId, {
                    file:  'api/messenger/contentscriptmessenger.js'
                });
            });
        },

        /**
         * Reloads all tabs actively using the Support Portal
         * @param request
         * @param sender
         * @param sendResponse
         */
        reloadTabs: function (message) {
            Messenger.getOpenPortalTabs(function (tabs) {
                console.info('# of tabs found: ', tabs.length);
                var activeTabs = tabs,
                    reload = confirm(message),
                    i = 0,
                    len = activeTabs.length;
                if (reload) {
                    console.info('Reloading all active tabs');
                    for (; i < len; i++) {
                        chrome.tabs.reload(activeTabs[i].id, {bypassCache: false}, function () {
                        });
                    }
                }
            });
        }
    };

    /**
     * Functions defined here are to be available for the content script
     * to call.
     */
    Messenger.actions = {
        reloadTabs: function (request, sender, sendResponse) {
            Messenger.reloadTabs('This will reload all tabs using the Support Portal. Are you sure?');
        },

        importantUpdateReload: function () {
            Messenger.reloadTabs([
                'An important update has been applied to the Support Portal extension.',
                'It is recommended you reload all tabs currently using the Support Portal.',
                '\n\nClick "Cancel" if you are unable to reload the tabs now.',
                '\n\nClick "Ok" to reload the tabs now.'
            ].join(' '));
        },

        isRequestFromActiveTab: function (request, sender, sendResponse) {
            chrome.tabs.query({
                active:            true, // Select active tabs
                lastFocusedWindow: true  // In the current window
            }, function (tabs) {
                sendResponse({isActiveTab: tabs.length === 1 && sender.tab.id === tabs[0].id});
            });

            // keep the connection alive for the async response
            return true;
        },

        injectContentScriptMessenger: function (request, sender) {
            Messenger.injectContentScriptMessenger(sender.tab.id);
        }
    }

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
                actions:    [
                    new chrome.declarativeContent.ShowPageAction()]
            }]);
        });
    });

    /**
     * This adds a listener for receiving any messages from the content script.
     */
    chrome.runtime.onMessage.addListener(Messenger.handleMessage);

    /**
     * Whenever the extension is updated, we need to re-inject the
     * content script messenger back into the content script. Once
     * an update occurs and the extension is reloaded, any previous
     * connection to the extension are closed and cannot be reused.
     * Injecting this back into the content script puts the scope
     * of chrome.runtime to the new instance.
     */
    chrome.runtime.onInstalled.addListener(function (details) {
        Messenger.getOpenPortalTabs(function (tabs) {
            tabs.forEach(function (tab) {
                Messenger.injectContentScriptMessenger(tab.id);
            });
        });
    });
}());
