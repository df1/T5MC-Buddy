/*
Built using Kango - Cross-browser extension framework.
http://kangoextensions.com/
*/
kango._initMessaging=function(){var listeners=[];safari.self.addEventListener('message',function(request){var event={name:request.name,data:request.message,origin:'tab',source:kango,target:kango};for(var i=0;i<listeners.length;i++){listeners[i](event);}});kango.dispatchMessage=function(name,data){safari.self.tab.dispatchMessage(name,data);};kango.addEventListener=function(type,listener){if(type=='message'){for(var i=0;i<listeners.length;i++){if(listeners[i]==listener){return;}}
listeners.push(listener);}};(new kango.InvokeAsyncModule()).init(kango);(new kango.MessageTargetModule()).init(kango);};