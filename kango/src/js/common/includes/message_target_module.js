/*
Built using Kango - Cross-browser extension framework.
http://kangoextensions.com/
*/
function KangoMessageTargetModule(){}
KangoMessageTargetModule.prototype.init=function(target){var listeners={};target.addMessageListener=function(name,listener){if(typeof listener.call!='undefined'&&typeof listener.apply!='undefined'){listeners[name]=listeners[name]||[];for(var i=0;i<listeners[name].length;i++){if(listeners[name][i]==listener){return;}}
listeners[name].push(listener);}};target.addEventListener('message',function(event){var name=event.name;if(typeof listeners[name]!='undefined'){for(var i=0;i<listeners[name].length;i++){listeners[name][i](event);}}});};if(typeof kango!='undefined'&&typeof kango.addModule!='undefined'){kango.addModule(KangoMessageTargetModule);}