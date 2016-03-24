# Support Portal Customizations - v2.1.x
**Requirements:**

You must first install the Tampermonkey extension for Chrome
(https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo?hl=en)

 Once the extension has been installed:
 1. Click the icon and choose *Dashboard*
 2. Click the *Utilities* tab on the upper-right
 3. Import the following URL:
 https://rawgit.com/tristanlee85/supportportal/master/supportportal.js
 4. Click *Install*

After the script is imported, it will be automatically enabled and available immediately. Refresh the portal application.
Tampermonkey is set to check for script updates daily by default. If you feel that scripts are not being updated
automatically, you may force an updated under the **Installed Scripts** tab. Simply click on the value under the **Last updated**
column to force a check.

This script provides the ability to add your own customizations to the application. Each customization can be
enabled or disabled based on your need. Additionally, customizations can also have their own configurations for
more granular features.

Customizations can be found under **Settings > Additional Customizations**. By default, customizations are disabled. 
Whenever a customizations is enabled/disabled, or configuration has changed, the application must be reloaded.

![Customizations](http://i.imgur.com/vx8rOj5.png)

**Fixes**:
 - Creating a hyperlink from selected text in the BBCode editor doesn't always promp to enter a URL

**Improvements**:
 - Ability to disable mouse wheel scrolling on Credits User field
 - Automatically parse non-linkified URLs in the reply bodies and fixes broken list items that code BBCode
 - Smart date formatter can be customized to either disable or limit the date difference to format
 
**Features**:
 - Localized ability to enable/disable specific customizations. This functionality can be found under *Settings > Additional Customizations*
 - Disable automatic error-reporting
 - Ticket ID in title header is a link to the production URL for easier copy/paste
 - Ability to save a reply as a draft from within the Submit button menu. The draft will be restored when you return to the ticket.
 - Default the tickets grid to only show tickets assigned to you

**Contributions:**

If you have a fix for additional issues or ideas for enhancements, submit a pull request. By default, Tampermonkey will check daily for updates to the scripts so as new fixes/features are added, you'll be kept up-to-date.
