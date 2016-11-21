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

    'update-notification': {
        force: true,
        scriptname: 'update-notification.js'
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
        text:           'Save Reply Draft',
        description:    ['Automatically saves the reply as a draft until it\'s submitted.',
                         'This becomes restored automatically when revisiting the ticket.'].join(' '),
        type:           'feature',
        scriptname:     'reply-draft.js',
        configurator:   'Customization.view.replydraft.Configurator'
    },

    'ticket-replies-parser': {
        text:        'Parse Ticket Replies',
        description: 'Parses non-linkified URLs and fixes various formattings issues',
        type:        'improvement',
        scriptname:  'ticket-replies-parser.js'
    },

    'smart-date-format': {
        text:             'Smart Date Formatting',
        description:      'Toggle the use of smart date formatting or cusotmize it to fit your needs',
        type:             'improvement',
        scriptname:       'smart-date-format.js',
        requiresOverride: 'Override.Date',
        configurator:     'Customization.view.smartdate.Configurator'
    },

    'auto-refresh-grid': {
        text:         'Auto-Refresh Grid',
        description:  'Automatically registers the store to the refresh manager',
        type:         'feature',
        scriptname:   'auto-refresh-grid.js',
        configurator: 'Customization.view.autorefresh.Configurator'
    },

    'status-detail-marker': {
        text: 'Status Detail Marker',
        description: 'Shows a colored marker at the configured position relating to the Status Detail',
        type: 'feature',
        scriptname: 'status-detail-marker.js',
        configurator: 'Customization.view.statusdetail.Configurator'
    },

    'filter-sets': {
        text: 'Filter Sets',
        description: 'Places the filter sets in the toolbar for easier access',
        type: 'improvement',
        scriptname: 'filter-sets.js'
    },

    'image-attachment-window': {
        text: 'Image Attachment Window',
        description: 'Places the image as an element so it can be scrolled and fixes issue where image may not display',
        type: 'bug',
        scriptname: 'image-attachment-window.js'
    },

    'credits-refund': {
        text: 'Quick Credits Refund',
        description: 'Provides quick access to refunding credits when adding an issue',
        type: 'feature',
        scriptname: 'credits-refund.js'
    },

    /*'code-select-all': {
        text: 'Copy All Code',
        description: 'Adds a link to a code block to quickly select and copy all the text',
        type: 'feature',
        scriptname: 'code-select-all.js'
    },*/

    'linkify-jira': {
        text: 'Linkify JIRA',
        description: 'Automatically linkify JIRA IDs in a reply body',
        type: 'feature',
        scriptname: 'linkify-jira.js'
    }
};
