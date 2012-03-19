/*
Built using Kango - Cross-browser extension framework.
http://kangoextensions.com/
*/
function KangoMessageRouter(){var self=this;opera.extension.onmessage=function(event){self._onMessage(event)};}
KangoMessageRouter.prototype={_onMessage:function(event){var message=JSON.parse(event.data);var e={name:message.name,data:message.data,origin:'tab',source:{dispatchMessage:function(name,data){event.source.postMessage(JSON.stringify({name:name,data:data}));}},target:kango.browser.getTabFromUrl(event.origin)};this.onmessage(e);},onmessage:function(event){},dispatchMessage:function(name,data){var event={name:name,data:data,origin:'background',source:kango,target:kango};var self=this;window.setTimeout(function(){self.onmessage(event)},1);}};