/**
 * This script will be injected from the content script and *only* available from
 * within the application.
 */
window.Messenger = (function (window, doc) {
    var
        /**
         * For holding message data
         * @type {object}
         */
        messageData = {},

        /**
         * Name (type) of the event when dispatching to the extension
         * @type {string}
         */
        sendEventName = 'portalmessage',

        /**
         * Name (type) of the event to listen for from the extension
         * @type {string}
         */
        receiveEventName = 'contentmessage',

        /**
         * Generates a new 'id' based on the current timestamp
         * @returns {number}
         */
        generateId = function () {
            return new Date().getTime();
        },

        /**
         * Invoked when the listener is fired. This validates the data passed
         * in the event.
         * @param event
         */
        receiveHandler = function (event) {
            console.log(this, arguments, 'receiveHandler');
        };

    return {
        // create a public function that can be called from the 'window'
        // scope of the content script to send an event to the client
        sendMessage: function (action, args, callback) {
            var data = {
                    requestId: generateId(),
                    action:    action,
                    args:      Array.isArray(args) ? args : [args]
                },
                event = new CustomEvent(sendEventName, {detail: data});

            // if a callback is supplied, we need to create a listener
            // to handle the response
            if (callback) {
                document.addEventListener(receiveEventName, function responseHandler(event) {
                    var responseData = event.detail || {};

                    // this is the response from this request
                    if (data.requestId === responseData.requestId) {
                        callback.apply(this, [responseData, data]);
                        document.removeEventListener(receiveEventName, responseHandler);
                    }
                });
            }

            document.dispatchEvent(event);
        }
    }
}(window, document));
