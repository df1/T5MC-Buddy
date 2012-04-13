/*
Built using Kango - Cross-browser extension framework.
http://kangoextensions.com/
*/
kango.MessageRouter=function(){var self=this;chrome.extension.onRequest.addListener(function(request,sender,sendResponse){self._onMessage(request,sender,sendResponse)});};kango.MessageRouter.prototype={_onMessage:function(request,sender,sendResponse){var event={name:request.name,data:request.data,origin:request.origin,target:null,source:null};if(request.origin=='tab'){event.source=new kango.BrowserTab(sender.tab);event.target=event.source;}
this.onmessage(event);},onmessage:function(event){},dispatchMessage:function(name,data){var event={name:name,data:data,origin:'background',target:kango,source:kango};var self=this;window.setTimeout(function(){self.onmessage(event)},1);}};