/*
Built using Kango - Cross-browser extension framework.
http://kangoextensions.com/
*/
KangoPopup.lang.getGlobalContext=function(){return opera.extension.bgProcess;};KangoPopup._getUrl=function(url){if(url.indexOf('http://')==-1&&url.indexOf('https://')==-1){return'../'+url;}
return url;};