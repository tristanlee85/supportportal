$(function () {
    var
        setButtonEnabled = function (button, enabled) {
            var setActive = enabled === true;
            button = $(button);

            // toggle if no value was passed
            if (enabled === undefined) {
                enabled = !button.hasClass('active');
            }

            if (enabled) {
                button.addClass('btn-success ' + (setActive ? 'active' : '')).removeClass('btn-danger').button('enabled');
            } else {
                button.addClass('btn-danger').removeClass('btn-success').button('disabled');
            }

            button.attr('aria-pressed', enabled);
        },

        handleFormBtn = function (evt) {
            var $btn = $(evt.target);

            // cancel
            if ($btn.hasClass('cancel')) {
                window.close();
            }

            // save
            saveSettings();
            if ($btn.hasClass('savereload')) {
                chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                    chrome.tabs.update(tabs[0].id, {url: tabs[0].url});
                });
            }

            window.close();
        },

        saveSettings = function () {
            storage.set({
                enableExtension: $enableExtension.hasClass('active'),
                localDevMode: $localDevMode.hasClass('active'),
                serverUrl: $serverUrl.val()
            });
        },

    // form fields
        $enableExtension = $('#enableExtension'),
        $localDevMode = $('#localDevMode'),
        $serverUrl = $('#serverUrl'),

    // storage settings
        storage = chrome.storage.local;

    // prepare storage and pre-set settings
    storage.get(null, function (items) {
        var enableExtension = items.enableExtension,
        localDevMode = items.localDevMode,
        serverUrl = items.serverUrl;

        setButtonEnabled($enableExtension, enableExtension);
        setButtonEnabled($localDevMode, localDevMode);
        $serverUrl.val(serverUrl);
    });

    $('body').on('click', '.form-buttons .btn', handleFormBtn);
    $('#enableExtension,#localDevMode').on('click', function (evt) {
        setButtonEnabled(evt.target);
    })
});
