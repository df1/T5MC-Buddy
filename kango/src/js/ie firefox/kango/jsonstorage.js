/*
Built using Kango - Cross-browser extension framework.
http://kangoextensions.com/
*/
function KangoJSONStorage(){}
KangoJSONStorage.prototype={getItem:function(name){var value=kango.simpleStorage.getItem(name);if(typeof value!='undefined'){return JSON.parse(value);}
else{return null;}},setItem:function(name,value){return kango.simpleStorage.setItem(name,JSON.stringify(value));},removeItem:function(name){return kango.simpleStorage.removeItem(name);},clear:function(){return kango.simpleStorage.clear();},getKeys:function(){return kango.simpleStorage.getKeys();}};kango.storage=new KangoJSONStorage();