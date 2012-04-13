/*
Built using Kango - Cross-browser extension framework.
http://kangoextensions.com/
*/
kango.MessageRouter=function(){};kango.MessageRouter.prototype={_onMessage:function(event){this.onmessage(event);},onmessage:function(event){},dispatchMessage:function(name,data){var event={name:name,data:data,origin:'background',target:kango,source:kango};var self=this;window.setTimeout(function(){self.onmessage(event)},1);}};