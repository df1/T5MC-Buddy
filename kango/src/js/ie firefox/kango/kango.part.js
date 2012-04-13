/*
Built using Kango - Cross-browser extension framework.
http://kangoextensions.com/
*/
kango.TabProxy=function(tab){this.xhr=kango.xhr;this.console=kango.console;this._tab=tab;this._listeners=[];(new kango.InvokeAsyncModule()).init(this);(new kango.MessageTargetModule()).init(this);};kango.TabProxy.prototype={_tab:null,_listeners:null,xhr:null,console:null,event:{Message:'message'},dispatchMessage:function(name,data){var event={name:name,data:data,origin:'tab',source:this._tab,target:this._tab};kango.fireEvent(kango.event.Message,event);},addEventListener:function(type,listener){if(type=='message'){for(var i=0;i<this._listeners.length;i++){if(this._listeners[i]==listener){return;}}
this._listeners.push(listener);}},fireEvent:function(type,event){event.source=event.target=this;if(type=='message'){for(var i=0;i<this._listeners.length;i++){this._listeners[i](event);}}}};