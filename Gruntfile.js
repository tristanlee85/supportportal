/*global module:false*/
module.exports = function (grunt) {
    grunt.initConfig({
        bump: {
            options: {
                files: ['package.json', 'extension/manifest.json'],
                updateConfigs: [],
                commit: false,
                commitMessage: 'Release v%VERSION%',
                commitFiles: ['package.json'],
                createTag: true,
                tagName: 'v%VERSION%',
                tagMessage: 'Version %VERSION%',
                push: false,
                pushTo: 'upstream',
                gitDescribeOptions: '--tags --always --abbrev=1 --dirty=-d',
                globalReplace: false,
                prereleaseName: false,
                metadata: '',
                regExp: false
            }
        },
    });

    grunt.loadNpmTasks('grunt-bump');

};