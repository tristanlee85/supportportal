# Support Portal Fixes
**Requirements:**

You must first install the Tampermonkey extension for Chrome
(https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo?hl=en)

 Once the extension has been installed:
 1. Click the icon and choose *Dashboard*
 2. Click the *Utilities* tab on the upper-right
 3. Import the following URL:
 https://raw.githubusercontent.com/tristanlee85/supportportal/master/supportportal.js
 4. Click *Install*

After the script is imported, it will be automatically enabled and available immediately. Refresh the portal application.

**Fixes**:

 - Ticket view scroll position jumps when selecting text/clicking row body
 - Creating hyperlink from selected text does not always prompt to enter a URL
 - List items containing BB code prematurely close the list and push the content to the next line
 - Ticket *Expand All* icon collapses any replies that are already expanded

**Improvements**:

 - Automatically parse links from their raw text
 - Minimum value of 0 is set to the *Credits Used* field. It was possible to apply negative credits to a ticket
 - Preserve scroll position when left ticket grid reloads
 - Enable text selection in panel header
 - Add ticket number as a link next to *Ticket Info*
 - Grid loads current user's tickets by default
 - Auto-collapse west menu based on state width

**Contributions:**

If you have a fix for additional issues or ideas for enhancements, submit a pull request. By default, Tampermonkey will check daily for updates to the scripts so as new fixes/features are added, you'll be kept up-to-date.
