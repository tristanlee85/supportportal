(function (window, document) {
    var storage = chrome.storage.local,
        portalScript = document.createElement('script'),
        messengerScript = document.createElement('script'),
        actions;

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

            // Message the extension the current version so it can continue to poll for updates
            chrome.runtime.sendMessage({version: chrome.runtime.getManifest().version});
        });
    };

    // Injects the messaging script
    messengerScript.src = chrome.extension.getURL('api/messenger/messenger.js');
    messengerScript.onload = function () {
        this.parentNode.removeChild(this);
    };

    // listen for messages from the application
    document.addEventListener('portalmessage', function (event) {
        var data = event.detail,
            action = data.action,
            actionArgs = data.args,
            requestId = data.requestId,
            responseData = {
                requestId: requestId,
                actionResult: null,
                success: false
            },
            replyEvent;

        // validate the action
        if (!actions.hasOwnProperty(action)) {
            console.error('The requested action "' + action + '" does not exist');
        } else {
            // invoke the requested action
            try {
                responseData.actionResult = actions[action].apply(this, actionArgs);
                responseData.success = true;
            } catch (e) {
                console.warn('Error while invoking action "' + action + '"');
                throw e;
            }
        }

        // respond back to the application
        replyEvent = new CustomEvent('contentmessage', {detail: responseData});
        document.dispatchEvent(replyEvent);
    });

    (document.head || document.documentElement).appendChild(portalScript);
    (document.head || document.documentElement).appendChild(messengerScript);

    /**
     * Actions are called from the application script to interact with the extension.
     */
    actions = {
        copyToClipboard: function (text) {
            var input = document.createElement('textarea');
            document.body.appendChild(input);
            input.value = text.trim();
            input.focus();
            input.select();
            document.execCommand('Copy');
            input.remove();
        },

        getExtensionVersion: function () {
            return chrome.runtime.getManifest().version;
        }
    };
}(window, document));
