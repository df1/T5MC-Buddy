/*
Built using Kango - Cross-browser extension framework.
http://kangoextensions.com/
*/
kango.Lang=function(){};kango.Lang.prototype=kango.oop.extend(kango.LangBase,{evalInSandbox:function(win,api,text){for(var key in api){if(api.hasOwnProperty(key)){arguments.callee[key]=api[key];}}
eval('(function(){'+text+'\n})();');}});kango.lang=new kango.Lang();