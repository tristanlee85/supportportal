window.addEventListener("message", function (event) {
    // We only accept messages from ourselves
    if (event.source != window) {
        return;
    }

    var settings = event.data;

    if (!settings.extensionScriptsPath) {
        window.console && console.error('Unable to load scripts path from extension. Aborting!');
        return;
    }

    // extension is disabled
    if (!settings.enableExtension) {
        return;
    }

    (function (window) {
        /**
         * This section contains environment variables that determine the location of any customization scripts
         * to be loaded. When developing scripts locally, you will want to change this mode so that it loads your
         * local files. Otherwise, the sources will be loaded form the extension.
         */
        var
            /**
             * This is the default remote path where all customization scripts will be stored. Unless you plan
             * on running scripts from your own server, there should be no need to change this. Script are
             * packed into the extension to reduce the need to remotely fetch them.
             */
            extensionScriptsPath = settings.extensionScriptsPath,

            /**
             * The local path for loading scripts during development.
             * @type {string}
             */
            localScriptsPath = settings.serverUrl,

            /**
             * The mode that the loader will use to determine which script path to use. Unless you are testing
             * scripts, this should be set to `false`.
             * @type {boolean}
             */
            localDevMode = settings.localDevMode;

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
         * - force : Boolean (optional) - if `true`, this customization will always be enabled
         * - requires: String/String[] - list of dependency customizations to be loaded prior; reference the customization name, not a class name
         * - requiresOverride: String/String[] - list of dependency classes that need to be loaded prior
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

            'utils': {
                force:      true,
                scriptname: 'utils.js'
            },

            'configurator': {
                force:      true,
                requires:   ['utils'],
                scriptname: 'configurator.js'
            },

            'credits-scroll': {
                text:        'Quick-scroll Credits',
                description: 'Disables mouse wheel events for the `Credits Used`',
                type:        'improvement',
                scriptname:  'credits-scroll.js'
            },

            'ticket-link': {
                text:        'Quick Link Copy',
                description: 'Adds a production link to the ticket ID to quicker copying',
                type:        'feature',
                scriptname:  'ticket-link.js'
            },

            'bbcode-link': {
                text:        'BBCode Link Option',
                description: 'Fixes issue where creating a hyperlink from selected text does not always display the prompt for supplying the URL',
                type:        'bug',
                scriptname:  'bbcode-link.js'
            },

            'reply-draft': {
                text:        'Save Reply Draft',
                description: ['Automatically saves the reply as a draft until it\'s submitted.',
                                 'This becomes restored automatically when revisiting the ticket.'].join(' '),
                type:        'feature',
                scriptname:  'reply-draft.js'
            },

            'ticket-replies-parser': {
                text:        'Parse Ticket Replies',
                description: 'Parses non-linkified URLs and fixes various formattings issues',
                type:        'improvement',
                scriptname:  'ticket-replies-parser.js'
            },

            'my-tickets-grid': {
                text:        'View My Tickets Only',
                description: 'Forces the full and mini grid to only show tickets assigned to you',
                type:        'feature',
                scriptname:  'my-tickets-mini-grid.js'
            },

            'smart-date-format': {
                text:             'Smart Date Formatting',
                description:      'Toggle the use of smart date formatting or cusotmize it to fit your needs',
                type:             'improvement',
                scriptname:       'smart-date-format.js',
                requires:         ['configurator'],
                requiresOverride: 'Override.Date',
                configurator:     'Customization.view.smartdate.Configurator'
            },

            'auto-refresh-grid': {
                text:         'Auto-Refresh Grid',
                description:  'Automatically registers the store to the refresh manager',
                type:         'feature',
                scriptname:   'auto-refresh-grid.js',
                requires:     ['configurator'],
                configurator: 'Customization.view.autorefresh.Configurator'
            },

            'filter-sets': {
                text:        'Filter Sets',
                description: 'Adds filter sets to the main ticket grid',
                type:        'feature',
                scriptname:  'filter-sets.js'
            }
        };


        /** ************************************************************************************************************ **/
        window.Ext = window.Ext || {};

        // because of when the scripts are executed by the extension, we must
        // check to see if the framework is available before applying
        var interval = setInterval(function () {
                // When the Microloader is available, we'll initialize everything
                if (window.Ext.Microloader) {
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
                        scriptPath = localDevMode ? localScriptsPath : extensionScriptsPath;

                    Ext.Microloader.onMicroloaderReady(function () {
                        var hasScripts = false,
                            scriptsLoaded = [],
                            scriptsToLoad = 0,
                            scriptsInterval;

                        // initialize the store with available customizations
                        store = initStore(customizations);

                        Ext.log({indent: 1, msg: 'Applying portal customizations...'});
                        store.each(function (record) {
                            var id = record.get('id'),
                                fn = record.get('fn'),
                                scriptName = record.get('scriptname'),
                                enabled = record.get('enabled'),
                                requires = record.get('requires'),
                                requiresOverride = record.get('requiresOverride'),
                                requiresInterval, loaderFn;

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

                            ++scriptsToLoad;

                            loaderFn = (function (record) {
                                var id = record.get('id'),
                                    fn = record.get('fn'),
                                    scriptName = record.get('scriptname');

                                return function () {
                                    // invoke the function
                                    if (fn) {
                                        try {
                                            fn.apply(this, [id]);
                                            fnSuccess(id);
                                        } catch (e) {
                                            fnError(id, e);
                                        } finally {
                                            Ext.Array.push(scriptsLoaded, id);
                                        }
                                    }

                                    // load the remote source; this should be synchronous since it's before Ext.isReady
                                    else {
                                        hasScripts = true;
                                        Ext.Loader.loadScript({
                                            url:     Ext.String.format('{0}{1}', scriptPath, scriptName),
                                            onLoad:  function () {
                                                fnSuccess(id);
                                                Ext.Array.push(scriptsLoaded, id);
                                            },
                                            onError: function () {
                                                fnError(id);
                                                Ext.Array.push(scriptsLoaded, id);
                                            }
                                        });
                                    }
                                }
                            }(record));


                            if (!requires && !requiresOverride) {
                                loaderFn();
                            } else {

                                // Let's hope no one went crazy with a circular reference.
                                // This is not fool-proof.
                                requiresInterval = setInterval(function () {
                                    var allRequired = true;


                                    if (!!requires) {
                                        if (Ext.isString(requires)) {
                                            requires = [requires];
                                        } else if (!Ext.isArray(requires)) {
                                            Ext.log({
                                                type: 'warn',
                                                msg:  Ext.String.format('Unable to require the customizations for \'{0}\'', id),
                                                dump: requires
                                            });
                                            clearInterval(requiresInterval);
                                        }

                                        // check to make sure all dependency scripts are loaded
                                        Ext.Array.forEach(requires, function (item) {
                                            if (!Ext.Array.contains(scriptsLoaded, item)) {
                                                return (allRequired = false);

                                            }
                                        });
                                    }

                                    if (!!requiresOverride) {
                                        if (Ext.isString(requiresOverride)) {
                                            requiresOverride = [requiresOverride];
                                        } else if (!Ext.isArray(requiresOverride)) {
                                            Ext.log({
                                                type: 'warn',
                                                msg:  Ext.String.format('Unable to require the override(s) for \'{0}\'', id),
                                                dump: requiresOverride
                                            });
                                            clearInterval(requiresInterval);
                                        }

                                        // check to make sure all dependency overrides are loaded
                                        Ext.Array.forEach(requiresOverride, function (item) {
                                            if (!Ext.ClassManager.overrideMap[item]) {
                                                return (allRequired = false);

                                            }
                                        });
                                    }

                                    if (allRequired) {
                                        clearInterval(requiresInterval);
                                        loaderFn();
                                    }
                                }, 10);
                            }
                        });

                        // wait for everything, including external resources, to complete
                        scriptsInterval = setInterval(function () {
                            if (scriptsLoaded.length === scriptsToLoad) {
                                clearInterval(scriptsInterval);
                                Ext.log({outdent: 1, level: 'info', msg: 'Portal customizations applied!'});
                            }
                        }, 10);
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
                        {name: 'force', type: 'boolean', defaultValue: false},
                        {name: 'fn', type: 'auto'},
                        {name: 'scriptname'},
                        {name: 'configurator', type: 'string'},
                        {name: 'requires', type: 'auto'},
                        {name: 'requiresOverride', type: 'auto'},
                        {name: 'enabled', type: 'boolean', defaultValue: false},
                        {name: 'refreshRequired', type: 'boolean'}
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
                    var enabled = value.force === true || storage.getItem(key) === 'true';
                    store.add({
                        id:               key,
                        text:             value.text || key,
                        description:      value.description,
                        type:             value.type,
                        force:            value.force,
                        fn:               value.fn,
                        scriptname:       value.scriptname,
                        configurator:     value.configurator,
                        requires:         value.requires,
                        requiresOverride: value.requiresOverride,
                        enabled:          enabled,
                        refreshRequired:  !enabled
                    });
                });

                return store;
            };
    })(window);
});
