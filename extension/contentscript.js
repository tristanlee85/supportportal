var s = document.createElement('script');
s.src = chrome.extension.getURL('supportportal.user.js');
s.onload = function () {
    this.parentNode.removeChild(this);
};
(document.head || document.documentElement).appendChild(s);
