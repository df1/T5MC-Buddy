/*
Built using Kango - Cross-browser extension framework.
http://kangoextensions.com/
*/
(function(){KangoLang.prototype.evalInSandbox=function(win,api,text){if(typeof api['kango']!='undefined'&&win!=null&&win!=window){api['kango']=kango.browser.getTabProxyForWindow(win);}
var sandbox=Components.utils.Sandbox(win);for(var key in api){if(api.hasOwnProperty(key)){sandbox[key]=api[key];}}
sandbox.__proto__=new XPCNativeWrapper(win);Components.utils.evalInSandbox('(function(){'+text+'\n})();',sandbox);};var invokeOriginal=KangoLang.prototype.invoke;KangoLang.prototype.invoke=function(){arguments[0]=arguments[0].replace(new RegExp('kango','i'),"kango");return invokeOriginal.apply(this,arguments);};})();