/*
Built using Kango - Cross-browser extension framework.
http://kangoextensions.com/
*/
KangoLang.prototype.evalInSandbox=function(win,api,text){for(var key in api){arguments.callee[key]=api[key];}
eval('(function(){'+text+'\n})()');};