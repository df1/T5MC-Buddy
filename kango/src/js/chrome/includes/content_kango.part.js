/*
Built using Kango - Cross-browser extension framework.
http://kangoextensions.com/
*/
kango._initMessaging=function(){var listeners=[];chrome.extension.onRequest.addListener(function(event,sender,sendResponse){event.source=event.target=kango;for(var i=0;i<listeners.length;i++){listeners[i](event);}});kango.dispatchMessage=function(name,data){var event={name:name,data:data,origin:'tab',source:null,target:null};chrome.extension.sendRequest(event,function(){});};kango.addEventListener=function(type,listener){if(type=='message'){for(var i=0;i<listeners.length;i++){if(listeners[i]==listener){return;}}
listeners.push(listener);}};(new kango.InvokeAsyncModule()).init(kango);(new kango.MessageTargetModule()).init(kango);};