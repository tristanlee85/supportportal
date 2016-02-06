// ==UserScript==
// @name         SenchaPortal
// @namespace    SenchaPortal
// @version      0.1
// @description  Contains temporary fixes to be applied to the portal
// @author       Tristan Lee
// @match        https://test-support.sencha.com
// @grant        none
// ==/UserScript==

(function() {
    window.Ext = Ext || {};
    
    // because of when the scripts are executed by the extension, we must
    // check to see if the framework is available before applying
    var interval = setInterval(function () {
        if (Ext.define) {
          
            /**
             * EXTJS-19770
             * Fixes issue where the ticket view scroll position jumps
             * when attempting to select text
             */
            Ext.define('override.grid.NavigationModel', {
                override: 'Ext.grid.NavigationModel',
                onItemMouseDown: function(view, record, item, index, mousedownEvent) {
                    var me = this;
                    // If the event is a touchstart, leave it until the click to focus
                    // A mousedown outside a cell. Must be in a Feature, or on a row border
                    if (!mousedownEvent.position.cellElement && (mousedownEvent.pointerType !== 'touch')) {
                        // Stamp the closest cell into the event as if it were a cellmousedown
                        me.getClosestCell(mousedownEvent);
                        // If we are not already on that position, set position there.
                        if (!me.position.isEqual(mousedownEvent.position)) {
                            me.setPosition(mousedownEvent.position, null, mousedownEvent);
                        }
                        // If the browser autoscrolled to bring the cell into focus
                        // undo that.
                        view.getScrollable().restoreState();
                    }
                }
            });
            Ext.define('override.grid.feature.RowBody', {
                override: 'Ext.grid.feature.RowBody',
                innerSelector: '.' + Ext.baseCSSPrefix + 'grid-rowbody'
            });
            
            /* ***************** Place additional fixes above ***************** */
            /* **************************************************************** */
            window.console && console.info && console.info('Portal fixes applied');
            clearInterval(interval);
        }
    }, 100);
})();
