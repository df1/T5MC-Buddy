/*
Built using Kango - Cross-browser extension framework.
http://kangoextensions.com/
*/
function KangoJSONStorage(){}
KangoJSONStorage.prototype={getItem:function(name){var value=localStorage.getItem(name);if(typeof value!='undefined'){return JSON.parse(value);}
else{return null;}},setItem:function(name,value){return localStorage.setItem(name,JSON.stringify(value));},removeItem:function(name){return localStorage.removeItem(name);},clear:function(){return localStorage.clear();},getKeys:function(){var keys=[];for(var i=0;i<localStorage.length;i++){keys.push(localStorage.key(i));}
return keys;}};kango.storage=new KangoJSONStorage();