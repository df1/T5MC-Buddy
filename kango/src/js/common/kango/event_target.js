/*
Built using Kango - Cross-browser extension framework.
http://kangoextensions.com/
*/
function KangoEvent(type,obj,target){this.type=type;this.target=target||null;this.CAPTURING_PHASE=1;this.AT_TARGET=2;this.BUBBLING_PHASE=3;this.currentTarget=null;this.eventPhase=0;this.bubbles=false;this.cancelable=false;this.timeStamp=0;this.stopPropagation=function(){};this.preventDefault=function(){};if(typeof obj=='object'){kango.oop.mixin(this,obj);}}
function KangoEventTarget(){this._listeners={};}
KangoEventTarget.prototype={_listeners:null,dispatchEvent:function(event){var eventType=event.type.toLowerCase();if(typeof this._listeners[eventType]!='undefined'){var listeners=this._listeners[eventType];for(var i=0;i<listeners.length;i++){listeners[i](event);}}
return false;},fireEvent:function(type,obj){return this.dispatchEvent(new KangoEvent(type,obj));},addEventListener:function(type,listener){if(typeof listener=='function'){var eventType=type.toLowerCase();var listeners=this._listeners[eventType]=this._listeners[eventType]||[];for(var i=0;i<listeners.length;i++){if(listeners[i]==listener){return;}}
listeners.push(listener);}},removeEventListener:function(type,listener){var eventType=type.toLowerCase();if(typeof this._listeners[eventType]!='undefined'){var listeners=this._listeners[eventType];for(var i=0;i<listeners.length;i++){if(listeners[i]==listener){listeners.splice(i,1);}}}}};