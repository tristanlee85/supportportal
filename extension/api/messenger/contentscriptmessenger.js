(function () {
    var Messenger = {
        handleMessage: function ($event) {
            var actions = Messenger.actions,
                data = $event.originalEvent.detail,
                action = data.action,
                actionArgs = data.args,
                requestId = data.requestId,
                responseData = {
                    requestId:    requestId,
                    actionResult: null,
                    success:      false
                },
                deferred = $.Deferred(),
                replyEvent;

            // validate the action
            if (!actions.hasOwnProperty(action)) {
                console.error('The requested action "' + action + '" does not exist');
            } else {
                // invoke the requested action
                try {
                    actions[action].apply(deferred, actionArgs);
                } catch (e) {
                    // If the manifest is undefined, we are going to assume that
                    // the extension has been reloaded and the original port has
                    // closed. At this point, we need to remove this listener.
                    // It can only be done here and not during a new injection
                    // because each new injected script is in its own isolated
                    // scope even though the document is shared.
                    if (chrome.runtime.getManifest() === undefined) {
                        $(document).off('portalmessage');
                        return;
                    }

                    console.warn('Error while invoking action "' + action + '"');
                    throw e;
                }
            }

            deferred.done(function (result) {
                responseData.actionResult = result || null;
                responseData.success = true;
            });

            deferred.always(function () {
                // respond back to the application
                replyEvent = new CustomEvent('contentmessage', {detail: responseData});
                document.dispatchEvent(replyEvent);
            });
        },

        /**
         * Actions are called from the application to be processed
         * by the content script.
         */
        actions: {
            copyToClipboard: function (text) {
                var input = document.createElement('textarea');
                document.body.appendChild(input);
                input.value = text.trim();
                input.focus();
                input.select();
                document.execCommand('Copy');
                input.remove();

                this.resolve();
            },

            getUpdateInfo: function () {
                var dfd = this,
                    tabRequestDfd = $.Deferred();

                // check to see that this request is coming from an active tab
                chrome.runtime.sendMessage({type: 'isRequestFromActiveTab'}, function (response) {
                    console.log('response: ', arguments);
                    tabRequestDfd.resolve(response.isActiveTab);
                });

                $.when(
                    // get contents of the manifest
                    $.get(chrome.extension.getURL('manifest.json')),

                    // get contants of the changelog
                    $.get(chrome.extension.getURL('script/changelog.json')),

                    // check if this request is from an active tab
                    tabRequestDfd.promise()
                    )
                    .then(function (manifestResp, changelogResp, activeTabResp) {
                        var manifest = $.parseJSON(manifestResp[0]),
                            changelog = $.parseJSON(changelogResp[0]);

                        dfd.resolve({
                            version:     manifest.version,
                            changelog:   changelog,
                            isActiveTab: activeTabResp
                        });
                    }, function () {
                        dfd.reject();
                    });
            },

            reloadTabs: function () {
                chrome.runtime.sendMessage({action: 'reloadTabs'});
            }
        }
    };

    $(document).on('portalmessage', Messenger.handleMessage);
}());
