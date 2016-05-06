(function (window, document) {
    var storage = chrome.storage.local,
        portalScript = document.createElement('script'),
        messengerScript = document.createElement('script');

    // Injects the customization script
    portalScript.src = chrome.extension.getURL('script/supportportal.js');
    portalScript.onload = function () {
        this.parentNode.removeChild(this);

        // get the current settings to pass to the script
        storage.get(null, function (items) {

            // check if first run
            if (Object.keys(items).length === 0) {
                storage.set({
                    enableExtension: true,
                    localDevMode:    false,
                    serverUrl:       null
                });
            }

            var settings = {
                enableExtension:     !!items.enableExtension,
                localDevMode:        !!items.localDevMode,
                serverUrl:           items.serverUrl || null,
                extensionScriptPath: chrome.extension.getURL('script'),
                messengerScriptPath: chrome.extension.getURL('api/messenger/messenger.js'),
                version:             chrome.runtime.getManifest().version
            };

            window.postMessage(settings, "*");
        });
    };

    // Injects the messaging script
    messengerScript.src = chrome.extension.getURL('api/messenger/messenger.js');
    messengerScript.onload = function () {
        this.parentNode.removeChild(this);
    };

    // Injects the content script messenger
    chrome.runtime.sendMessage({action: 'injectContentScriptMessenger'});

    (document.head || document.documentElement).appendChild(portalScript);
    (document.head || document.documentElement).appendChild(messengerScript);
}(window, document));
