var storage = chrome.storage.local,
    s = document.createElement('script');
s.src = chrome.extension.getURL('script/supportportal.js');
s.onload = function () {
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
            version:             chrome.runtime.getManifest().version
        };

        window.postMessage(settings, "*");

        // Message the extension the current version so it can continue to poll for updates
        chrome.runtime.sendMessage({version: chrome.runtime.getManifest().version});
    });

    // script-specific listeners
    document.addEventListener('copyselectedtext', function () {
        document.execCommand('copy');
    })
};
(document.head || document.documentElement).appendChild(s);
