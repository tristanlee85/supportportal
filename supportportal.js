// ==UserScript==
// @name         SenchaPortal
// @namespace    SenchaPortal
// @version      2.1.0.4
// @description  Contains customizations to be applied to the portal
// @author       Tristan Lee
// @match        https://test-support.sencha.com
// @grant        none
// ==/UserScript==

(function () {
    /**
     * This section contains environment variables that determine the location of any customization scripts
     * to be loaded. When developing scripts locally, you will want to change this mode so that it loads your
     * local files. Otherwise, the typical remote source is used since all scripts will be available in the
     * repository.
     */
    var
        /**
         * This is the default remote path where all customization scripts will be stored. Unless you plan
         * on running scripts from your own repository, there should be no need to change this. Also notice
         * that rawgit.com is used. This is a MUST so that the scripts are returned with the correct MIME
         * type. Otherwise, they are received as text/plain and will not be executed.
         * @type {string}
         */
        remoteScriptPath = '//rawgit.com/tristanlee85/supportportal/2.1.x/scripts/',

        /**
         * The local path for loading scripts during development.
         * @type {string}
         */
        localScriptPath = '//support.sencha.dev/scripts/',

        /**
         * The mode that the loader will use to determine which script path to use. Unless you are testing
         * scripts, this should be set to `remote`.
         * @type {string} local|remote
         */
        scriptMode = 'remote';

    /**
     * Customizations are overrides to be applied to the application as it's loaded.
     * These can be anything including bug fixes, improvements, or new features. Each
     * customization is loaded and activated depending on the user's setting. You may
     * disable any customizations under the 'Settings > Additional Customizations'
     * menu.
     *
     * For the sake of consistency, classes should be defined in the `Customization` namespace.
     * Overrides should be defined in the `Override` namespace.
     *
     * Configurations can be defined with the following parameters:
     * - text : String (optional) - friendly display name for the customization
     * - description : String (optional) - short description about the customization
     * - type : String (required) - can be one of the following: bug|improvement|feature
     * - required : Boolean (optional) - if `true`, this customization will always be enabled
     * - fn : Function (required) - mutually exclusive to `scriptname`, this contains the heart of the customization
     * - scriptname : String (required) - mutually exclusive to `fn`, this loads a remote customization (eg. reply-draft.js)
     */
    var customizations = {
        'error-reporting': {
            text:        'Disable Error Reporting',
            description: 'Prevents application errors from being reported',
            type:        'feature',
            fn:          function () {

                Ext.define('Override.error.Manager', {}, function () {
                    Ext.error.Manager.setActive({onerror: false, exterror: false});
                });
            }
        },

        'settings-custom': {
            description: 'Adds a menu item for toggling customizations',
            type:        'feature',
            required:    true,
            scriptname:  'settings-custom.js'
        },
        'credits-scroll':  {
            text:        'Quick-scroll Credits',
            description: 'Disables mouse wheel events for the `Credits Used`',
            type:        'improvement',
            scriptname:  'credits-scroll.js'
        },
        'ticket-link':     {
            text:        'Quick Link Copy',
            description: 'Adds a production link to the ticket ID to quicker copying',
            type:        'feature',
            scriptname:  'ticket-link.js'
        },
        'bbcode-link':     {
            text:        'BBCode Link Option',
            description: 'Fixes issue where creating a hyperlink from selected text does not always display the prompt for supplying the URL',
            type:        'bug',
            scriptname:  'bbcode-link.js'
        },
        'reply-draft':     {
            text:        'Save Reply Draft',
            description: ['Automatically saves the reply as a draft until it\'s submitted.',
                             'This becomes restored automatically when revisitng the ticket.'].join(' '),
            type:        'feature',
            scriptname:  'reply-draft.js'
        }
    };


    /** ************************************************************************************************************ **/
    window.Ext = Ext || {};

    // because of when the scripts are executed by the extension, we must
    // check to see if the framework is available before applying
    var interval = setInterval(function () {
            // When the Microloader is available, we'll initialize everything
            if (Ext.Microloader) {
                clearInterval(interval);

                var store,
                    fnSuccess = function (id) {
                        Ext.log({level: 'info', msg: Ext.String.format('- \'{0}\': success', id)});
                    },
                    fnError = function (id, ex) {
                        Ext.log({
                            level: 'error',
                            msg:   Ext.String.format('- \'{0}\': failure', id),
                            stack: true,
                            dump:  ex || null
                        });
                    },
                    scriptPath = scriptMode === 'local' ? localScriptPath : remoteScriptPath;

                Ext.Microloader.onMicroloaderReady(function () {
                    var hasScripts = false,
                        scriptsLoaded = [],
                        scriptsInterval;

                    // initialize the store with available customizations
                    store = initStore(customizations);

                    Ext.log({indent: 1, msg: 'Applying portal customizations...'});
                    store.each(function (record) {
                        var id = record.get('id'),
                            fn = record.get('fn'),
                            scriptName = record.get('scriptname'),
                            enabled = record.get('enabled');

                        // ensure both properties weren't supplied
                        if (fn && scriptName) {
                            Ext.log({
                                level: 'warn',
                                msg:   Ext.String.format('Unable to apply \'{0}\'. \'fn\' and \'scriptname\' must be mutually exclusive.', id)
                            });
                            return;
                        }
                        // make sure it's enabled for the user
                        else if (!enabled) {
                            return;
                        }

                        // invoke the function
                        if (fn) {
                            try {
                                fn.apply(this, [id]);
                                fnSuccess(id);
                            } catch (e) {
                                fnError(id, e);
                            }
                        }

                        // load the remote source; this should be synchronous since it's before Ext.isReady
                        else {
                            hasScripts = true;
                            Ext.Loader.loadScript({
                                url:     Ext.String.format('{0}{1}', scriptPath, scriptName),
                                onLoad:  function () {
                                    fnSuccess(id);
                                    Ext.Array.remove(scriptsLoaded, id);
                                },
                                onError: function () {
                                    fnError(id);
                                    Ext.Array.remove(scriptsLoaded, id);
                                }
                            });
                            Ext.Array.push(scriptsLoaded, id);
                        }
                    });

                    if (hasScripts) {
                        scriptsInterval = setInterval(function () {
                            if (scriptsLoaded.length === 0) {
                                clearInterval(scriptsInterval);
                                Ext.log({outdent: 1, level: 'info', msg: 'Portal customizations applied!'});
                            }
                        }, 1);
                    } else {
                        Ext.log({outdent: 1, level: 'info', msg: 'Portal customizations applied!'});
                    }
                });

            }
        }, 10),

        initStore = function (customizations) {
            Ext.define('Customization', {
                extend: 'Ext.data.Model',

                fields: [
                    {name: 'id', type: 'string', unique: true},
                    {name: 'text'},
                    {name: 'description'},
                    {name: 'type'},
                    {name: 'required', type: 'boolean', defaultValue: false},
                    {name: 'fn', type: 'auto'},
                    {name: 'scriptname'},
                    {name: 'enabled', type: 'boolean', defaultValue: false}
                ],

                proxy: {
                    type: 'memory' // really wish the LocalStorage proxy was available...
                }
            });

            var store = Ext.create('Ext.data.Store', {
                    storeId:   'portal-customizations',
                    model:     'Customization',
                    autoLoad:  true,
                    autoSync:  true,
                    listeners: {
                        write: function (store, operation) {
                            // there should always be only 1 record since the sync is made per action
                            var record = operation.getRecords()[0];
                            storage.setItem(record.get('id'), record.get('enabled'));
                        }
                    }
                }),
                storage = Ext.util.LocalStorage.get('portal-customizations');

            Ext.iterate(customizations, function (key, value) {
                store.add({
                    id:          key,
                    text:        value.text || key,
                    description: value.description,
                    type:        value.type,
                    required:    value.required,
                    fn:          value.fn,
                    scriptname:  value.scriptname,
                    enabled:     value.required === true || storage.getItem(key) === 'true'
                });
            });

            return store;
        };
})();
