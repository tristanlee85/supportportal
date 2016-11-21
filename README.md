# Support Portal Customizations - v2.1.x
**Requirements:**

To use the Support Portal Customizations, you must install the Chrome extension: https://chrome.google.com/webstore/detail/support-portal/ihaddpnkjclhdanchepbncbajlkkadjc
**If you are still using the Tampermonkey script, it is no longer being maintained and may fail to work in the future.**

Once the extension is installed, just refresh the application and it's ready to use.
*Note: Chrome checks every few hours for an update so you can be sure you always have the latest version installed.*

This script provides the ability to add your own customizations to the application. Each customization can be
enabled or disabled based on your need. Additionally, customizations can also have their own configurations for
more granular features.

Customizations can be found under **Settings > Additional Customizations**. By default, customizations are disabled. 
Whenever a customizations is enabled/disabled, or configuration has changed, the application must be reloaded.

![Customizations](http://i.imgur.com/vx8rOj5.png)

**Fixes**:
 - Creating a hyperlink from selected text in the BBCode editor doesn't always prompt to enter a URL

**Improvements**:
 - Ability to disable mouse wheel scrolling on Credits User field
 - Automatically parse non-linkified URLs in the reply bodies and fixes broken list items that code BBCode
 - Smart date formatter can be customized to either disable or limit the date difference to format
 - Filter Sets are also available from a menu button at the top toolbar of the full ticket grid
 
**Features**:
 - Localized ability to enable/disable specific customizations. This functionality can be found under *Settings > Additional Customizations*
 - Disable automatic error-reporting
 - Ticket ID in title header is a link to the production URL for easier copy/paste
 - Ability to save a reply as a draft from within the Submit button menu. The draft will be restored when you return to the ticket.
 - ~~Default the tickets grid to only show tickets assigned to you~~ Removed since this can be handled with filter sets
 - Auto-refresh and loadmask configurations for the main and mini ticket grid
 - Display Status Detail color marker next to row in the mini ticket grid
 - Quick button for refunding credits (button sets credits to 0 automatically)
 - ~~Ability to copy all code within a code example block~~ Removed since this has been implemented directly in the 
 application
 - Automatically linkify Jira IDs in the reply body

**Contributions:**

If you have a fix for additional issues or ideas for enhancements, submit a pull request or log it in the [tracker](https://github.com/tristanlee85/supportportal/issues).
