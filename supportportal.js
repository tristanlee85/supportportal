window.addEventListener("message", function (event) {
    // We only accept messages from ourselves
    if (event.source != window) {
        return;
    }

    var settings = event.data;

    if (!settings.extensionScriptPath) {
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
            extensionScriptPath = settings.extensionScriptPath,

            /**
             * The local path for loading scripts during development.
             * @type {string}
             */
            localScriptPath = settings.serverUrl,

            /**
             * The mode that the loader will use to determine which script path to use. Unless you are testing
             * scripts, this should be set to `false`.
             * @type {boolean}
             */
            localDevMode = settings.localDevMode,

            scriptsPath = '/scripts/',
            configPath = '/config.js',
            fullConfigPath, fullScriptsPath,

            stripTrailingSlash = function (str) {
                if (str.substr(-1) === '/') {
                    return str.substr(0, str.length - 1);
                }
                return str;
            };

        // set the path for loading resources
        if (localDevMode) {
            window.console && window.console.warn('Support Portal extension in dev mode. Loading scripts from ' + localScriptPath);
            fullConfigPath = stripTrailingSlash(localScriptPath) + configPath;
            fullScriptsPath = stripTrailingSlash(localScriptPath) + scriptsPath;
        } else {
            fullConfigPath = stripTrailingSlash(extensionScriptPath) + configPath;
            fullScriptsPath = stripTrailingSlash(extensionScriptPath) + scriptsPath;
        }

        /** ************************************************************************************************************ **/
        window.Ext = window.Ext || {};
        window.portalExtensionVersion = settings.version;

        var
            scriptsLoaderFn = function () {
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
                        scriptPath = fullScriptsPath;

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
            },

            initStore = function (configs) {
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

                Ext.iterate(configs, function (key, value) {
                    var enabled = value.force === true || storage.getItem(key) === 'true',
                        data = {
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
                        };
                    
                    // automatically require the configurator if it's used
                    if(data.configurator) {
                        data.requires = Ext.isArray(data.requires) ? data.requires : [];
                        data.requires.push('configurator');
                        data.requires = Ext.Array.unique(data.requires);
                    }
                    store.add(data);
                });

                // set the current version to local storage
                storage.setItem('portal-extension-version', window.portalExtensionVersion);

                return store;
            },
            s = document.createElement('script'),
            configs, interval;

        // Variables and the scripts loader is defined. Now we need to load in
        // the customizations config. Onces this is loaded in, we'll reference
        // the variable to current scope and then start the loader.
        s.src = fullConfigPath;
        s.onload = function () {
            this.parentNode.removeChild(this);
            configs = customizations;
            interval = setInterval(scriptsLoaderFn, 10);
        };
        (document.head || document.documentElement).appendChild(s);
    })(window);
});
