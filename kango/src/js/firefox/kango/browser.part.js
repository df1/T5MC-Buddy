/*
Built using Kango - Cross-browser extension framework.
http://kangoextensions.com/
*/
kango.WebProgressListener=function(callback){this._callback=callback;};kango.WebProgressListener.prototype={_callback:null,QueryInterface:function(aIID){if(aIID.equals(Components.interfaces.nsIWebProgressListener)||aIID.equals(Components.interfaces.nsISupportsWeakReference)||aIID.equals(Components.interfaces.nsISupports))
return this;throw Components.results.NS_NOINTERFACE;},onProgressChange:function(aWebProgress,aRequest,aCurSelfProgress,aMaxSelfProgress,aCurTotalProgress,aMaxTotalProgress){},onStatusChange:function(aWebProgress,aRequest,aStatus,aMessage){},onSecurityChange:function(aWebProgress,aRequest,aState){},onLocationChange:function(aProgress,aRequest,aLocation){},onStateChange:function(aWebProgress,aRequest,aStateFlags,aStatus){var nsIWebProgressListener=Components.interfaces.nsIWebProgressListener;if(aStateFlags&nsIWebProgressListener.STATE_START&&aStateFlags&nsIWebProgressListener.STATE_IS_DOCUMENT){var nsIChannel=Components.interfaces.nsIChannel;var event={url:aRequest.QueryInterface(nsIChannel).originalURI.spec,window:aWebProgress.DOMWindow,document:aWebProgress.DOMWindow.document};this._callback(event);}}};kango.Browser=function(){this.superclass.apply(this,arguments);var self=this;this._webProgressListener=new kango.WebProgressListener(function(event){self._onPageBeforeNavigate(event)});kango.addEventListener(kango.event.Ready,function(){self._subscribeEvents();});};kango.Browser.prototype=kango.oop.extend(kango.BrowserBase,{_webProgressListener:null,_subscribeEvents:function(){var self=this;document.getElementById('appcontent').addEventListener('DOMContentLoaded',function(event){self._onPageLoad(event);},true);gBrowser.addProgressListener(this._webProgressListener,Components.interfaces.nsIWebProgress.NOTIFY_STATE_DOCUMENT);gBrowser.tabContainer.addEventListener('TabSelect',function(event){self._onTabChanged(null);},false);},_onPageBeforeNavigate:function(event){if(!event.document.defaultView.frameElement){var win=event.document.defaultView.top;var e={url:event.url,target:new kango.BrowserTab(win)};this.fireEvent(this.event.BeforeNavigate,e);}},_onPageLoad:function(event){var doc=event.originalTarget;if(doc instanceof HTMLDocument){var win=doc.defaultView;var url='';try{url=doc.location.href;}
catch(ex){}
var e={url:url,title:doc.title||'',target:new kango.BrowserTab(win)};if(!doc.defaultView.frameElement){this.fireEvent(this.event.DocumentComplete,e);}
e.window=win;this.fireEvent('DOMContentLoaded',e);}},_onTabChanged:function(event){var doc=window.content.document;var win=doc.defaultView;var url='';try{url=doc.location.href;}
catch(ex){}
var e={url:url,title:doc.title||'',target:new kango.BrowserTab(win)};this.fireEvent(this.event.TabChanged,e);},getName:function(){return'firefox';},windows:{getAll:function(callback){var wm=Components.classes['@mozilla.org/appshell/window-mediator;1'].getService(Components.interfaces.nsIWindowMediator);var browserEnumerator=wm.getEnumerator('navigator:browser');var result=[];while(browserEnumerator.hasMoreElements()){result.push(new kango.BrowserWindow(browserEnumerator.getNext().gBrowser));}
callback(result);},getCurrent:function(callback){callback(new kango.BrowserWindow(gBrowser));},create:function(details){window.open(details.url);}},getTabProxyForWindow:function(win){var proxyName='KangoTabProxy_'+kango.getExtensionInfo().id;if(typeof win[proxyName]=='undefined'){win[proxyName]=new kango.TabProxy(new kango.BrowserTab(win));}
return win[proxyName];}});kango.Browser.prototype.tabs.create=function(details){var tab=gBrowser.addTab(details.url);if(typeof details.focused=='undefined'||details.focused){gBrowser.selectedTab=tab;}};kango.BrowserWindow=function(tabbrowser){this._tabbrowser=tabbrowser;};kango.BrowserWindow.prototype=kango.oop.extend(kango.IBrowserWindow,{_tabbrowser:null,getTabs:function(callback){var result=[];var tabContainer=this._tabbrowser.tabContainer;for(var i=0;i<tabContainer.childNodes.length;i++){result.push(new kango.BrowserTab(gBrowser.getBrowserForTab(tabContainer.childNodes[i]).contentWindow));}
callback(result);},getCurrentTab:function(callback){var tabContainer=this._tabbrowser.tabContainer;var tab=null;for(var i=0;i<tabContainer.childNodes.length;i++){tab=tabContainer.childNodes[i];if(tab.selected){break;}}
callback(new kango.BrowserTab(gBrowser.getBrowserForTab(tab).contentWindow));},isActive:function(){return true;}});kango.BrowserTab=function(win){this._win=win;this._tab=this._getTabFromWindow(win);};kango.BrowserTab.prototype=kango.oop.extend(kango.IBrowserTab,{_tab:null,_win:null,_getTabFromWindow:function(win){var targetBrowserIndex=gBrowser.getBrowserIndexForDocument(win.top.document);if(targetBrowserIndex!=-1){return gBrowser.tabContainer.childNodes[targetBrowserIndex];}
return null},getUrl:function(){var url='';try{url=this.getDOMWindow().document.location.href;}
catch(e){}
return url;},getTitle:function(){var title='';try{title=this.getDOMWindow().document.title;}
catch(e){}
return title;},getDOMWindow:function(){return this._win.wrappedJSObject;},isActive:function(){return this._tab.selected;},navigate:function(url){gBrowser.getBrowserForTab(this._tab).setAttribute('src',url);},dispatchMessage:function(name,data){var event={name:name,data:data,origin:'tab',source:kango,target:kango};kango.browser.getTabProxyForWindow(this._win).fireEvent('message',event);}});kango.browser=new kango.Browser();