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

**Fixes**:
 - Creating a hyperlink from selected text in the BBCode editor doesn't always promp to enter a URL

**Improvements**:
 - Ability to disable mouse wheel scrolling on Credits User field
 - Automatically parse non-linkified URLs in the reply bodies and fixes broken list items that code BBCode
 
**Features**:
 - Localized ability to enable/disable specific customizations. This functionality can be found under *Settings > Additional Customizations*
 - Disable automatic error-reporting
 - Ticket ID in title header is a link to the production URL for easier copy/paste
 - Reply draft functionality automatically saves your reply as you type. You may return to the ticket later and the reply will be automatically restored. The draft is removed once the reply is sent.
 - Default the tickets grid to only show tickets assigned to you

**Contributions:**

If you have a fix for additional issues or ideas for enhancements, submit a pull request. By default, Tampermonkey will check daily for updates to the scripts so as new fixes/features are added, you'll be kept up-to-date.
