/*
Built using Kango - Cross-browser extension framework.
http://kangoextensions.com/
*/
kango.Lang=function(){};kango.Lang.prototype=kango.oop.extend(kango.LangBase,{evalInSandbox:function(win,api,text){if(typeof api['kango']!='undefined'&&win!=null&&win!=window){api['kango']=kango.browser.getTabProxyForWindow(win);}
var sandbox=Components.utils.Sandbox(win);for(var key in api){if(api.hasOwnProperty(key)){sandbox[key]=api[key];}}
sandbox.__proto__=new XPCNativeWrapper(win);Components.utils.evalInSandbox('(function(){'+text+'\n})();',sandbox);},invoke:function(){arguments[0]=arguments[0].replace(new RegExp('kango','i'),"kango");return kango.LangBase.prototype.invoke.apply(this,arguments);}});kango.lang=new kango.Lang();