/*
Built using Kango - Cross-browser extension framework.
http://kangoextensions.com/
*/
function FireDOMContentLoadedEvent(){if(!(window!=window.top)){kango.dispatchMessage('KangoBrowser_DOMContentLoaded',{url:document.location.href,title:document.title});}}
function FireBeforeNavigateEvent(){if(!(window!=window.top)){kango.dispatchMessage('KangoBrowser_BeforeNavigate',{url:document.location.href});}}
function KangoBrowserHelper(){}
KangoBrowserHelper.prototype={init:function(){var self=this;kango.addMessageListener('KangoBrowser_navigate',function(event){self.navigate(event.data);});FireBeforeNavigateEvent();},navigate:function(data){document.location.href=data;}};kango._initMessaging=function(){var listeners=[];opera.extension.onmessage=function(event){var message=JSON.parse(event.data);var e={name:message.name,data:message.data,origin:event.origin,source:{dispatchMessage:function(name,data){event.source.postMessage(JSON.stringify({name:name,data:data}));}},target:kango};for(var i=0;i<listeners.length;i++){listeners[i](e);}};kango.dispatchMessage=function(name,data){opera.extension.postMessage(JSON.stringify({name:name,data:data}));};kango.addEventListener=function(type,listener){if(type=='message'){for(var i=0;i<listeners.length;i++){if(listeners[i]==listener){return;}}
listeners.push(listener);}};(new KangoInvokeAsyncModule()).init(kango);(new KangoMessageTargetModule()).init(kango);(new KangoBrowserHelper()).init();};var documentStartInitialized=false;function KangoDelayedInitStart(){if(typeof KangoUserscriptEngineClient!='undefined'&&typeof kango!='undefined'){kango._init('document-start');documentStartInitialized=true;}
else{window.setTimeout(KangoDelayedInitStart,10);}}
KangoDelayedInitStart();function KangoDelayedInitEnd(){if(documentStartInitialized&&document.readyState=='complete'){kango._init('document-end');FireDOMContentLoadedEvent();}
else{window.setTimeout(KangoDelayedInitEnd,50);}}
if(document.readyState=='complete'||document.readyState=='interactive'){KangoDelayedInitEnd();}
else{window.addEventListener('DOMContentLoaded',KangoDelayedInitEnd,false);}