var storage = chrome.storage.local,
    s = document.createElement('script');
s.src = chrome.extension.getURL('script/supportportal.js');
s.onload = function () {
    this.parentNode.removeChild(this);

    // get the current settings to pass to the script
    chrome.storage.local.get(null, function (items) {

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
            extensionScriptPath: chrome.extension.getURL('script')
        };

        window.postMessage(settings, "*");
    });
};
(document.head || document.documentElement).appendChild(s);
