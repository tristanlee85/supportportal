/*global module:false*/
module.exports = function (grunt) {
    var Handlebars = require('handlebars');

    grunt.initConfig({
        package: grunt.file.readJSON('package.json'),
        bump: {
            options: {
                files: ['package.json', 'extension/manifest.json'],
                updateConfigs: [],
                commit: true,
                commitMessage: 'Release v%VERSION%',
                commitFiles: ['package.json', 'extension/manifest.json', 'changelog.txt'],
                createTag: true,
                tagName: 'v%VERSION%',
                tagMessage: 'Version %VERSION%',
                push: true,
                pushTo: 'origin',
                gitDescribeOptions: '--tags --always --abbrev=1 --dirty=-d',
                globalReplace: false,
                prereleaseName: false,
                metadata: '',
                regExp: false
            }
        },

        changelog: {
            portal: {
                options: {
                    after: 'v<%= package.version %>',
                    partials: {
                        features: '{{#each features}}{{> feature}}{{/each}}',
                        feature: '[FEATURE] {{this}}\n',
                        fixes: '{{#each fixes}}{{> fix}}{{/each}}',
                        fix: '[BUGFIX] {{this}}\n'
                    }
                }
            },
            // JSON version for easier parsing
            extension: {
                options: {
                    after: 'v<%= package.version %>',
                    dest: 'changelog.json',
                    template: '{"fixes": [{{> fixes }}], "features": [{{> features }}]}',
                    helpers: {
                        toJSON: function (object) {
                            return new Handlebars.SafeString(JSON.stringify(object));
                        }
                    },
                    partials: {
                        features: '{{#each features}}{{> feature}}{{#unless @last}},{{/unless}}{{/each}}',
                        feature: '{{toJSON this}}',
                        fixes: '{{#each fixes}}{{> fix}}{{#unless @last}},{{/unless}}{{/each}}',
                        fix: '{{toJSON this}}'
                    }
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-bump');
    grunt.loadNpmTasks('grunt-changelog');
};
