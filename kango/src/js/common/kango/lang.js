/*
Built using Kango - Cross-browser extension framework.
http://kangoextensions.com/
*/
function KangoLang(){}
KangoLang.prototype={getGlobalContext:function(){return((function(){return this;}).call(null));},invoke:function(methodName,params){var arr=methodName.split('.');var parent=this.getGlobalContext();var funcName=arr.pop();for(var i=0;i<arr.length;i++){parent=parent[arr[i]];}
return parent[funcName].apply(parent,params);},evalInSandbox:function(win,api,text){throw new KangoNotImplementedException();},clone:function(obj){return JSON.parse(JSON.stringify(obj));},isString:function(obj){return(typeof obj=='string'||obj instanceof String);},isObject:function(obj){return(Object.prototype.toString.call(obj)=='[object Object]'||typeof obj=='object');},isArray:function(obj){return(obj instanceof Array||Object.prototype.toString.call(obj)=='[object Array]');},isFunction:function(obj){return(typeof obj=='function');}};kango.lang=new KangoLang();