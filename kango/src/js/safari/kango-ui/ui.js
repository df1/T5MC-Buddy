/*
Built using Kango - Cross-browser extension framework.
http://kangoextensions.com/
*/
kango.ui={_eventListener:new KangoEventTarget(),_init:function(){var browser_button=kango.getExtensionInfo().browser_button;if(kango.lang.isObject(browser_button)){kango.ui.browserButton=new KangoUIBrowserButton(browser_button);}
return this._eventListener.fireEvent(this.event.Ready);},event:{Ready:'Ready'},addEventListener:function(name,callback){return this._eventListener.addEventListener(name,callback);},removeEventListener:function(name,callback){return this._eventListener.removeEventListener(name,callback);}};kango.addEventListener(kango.event.Ready,function(){kango.ui._init();});