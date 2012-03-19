/*
Built using Kango - Cross-browser extension framework.
http://kangoextensions.com/
*/
function KangoMessageRouter(){var self=this;safari.application.addEventListener('message',function(request){self._onMessage(request)});}
KangoMessageRouter.prototype={_onMessage:function(request){var event={name:request.name,data:request.message,origin:'tab',target:new KangoBrowserTabImpl(request.target),source:{dispatchMessage:function(name,data){request.target.page.dispatchMessage(name,data);}}};this.onmessage(event);},onmessage:function(event){},dispatchMessage:function(name,data){var event={name:name,data:data,origin:'background',source:kango,target:kango};var self=this;window.setTimeout(function(){self.onmessage(event)},1);}};