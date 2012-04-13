/*
Built using Kango - Cross-browser extension framework.
http://kangoextensions.com/
*/
kango.Browser=function(){this.superclass.apply(this,arguments);var self=this;safari.application.addEventListener('beforeNavigate',function(e){self._onBeforeNavigate(e)},true);safari.application.addEventListener('navigate',function(e){self._onNavigate(e)},true);safari.application.addEventListener('activate',function(e){self._onActivate(e)},true);};kango.Browser.prototype=kango.oop.extend(kango.BrowserBase,{_onBeforeNavigate:function(event){var e={url:event.url,target:new kango.BrowserTab(event.target)};this.fireEvent(this.event.BeforeNavigate,e);},_onNavigate:function(event){var tab=event.target;var e={url:tab.url||'',title:tab.title||'',target:new kango.BrowserTab(tab)};this.fireEvent(this.event.DocumentComplete,e);},_onActivate:function(event){if(event.target instanceof SafariBrowserTab){var tab=event.target;var e={url:tab.url||'',title:tab.title||'',target:new kango.BrowserTab(tab)};this.fireEvent(this.event.TabChanged,e);}},getName:function(){return'safari';},windows:{getAll:function(callback){var wins=safari.application.browserWindows;var result=[];for(var i=0;i<wins.length;i++){result.push(new kango.BrowserWindow(wins[i]))}
callback(result);},getCurrent:function(callback){callback(new kango.BrowserWindow(safari.application.activeBrowserWindow));},create:function(details){safari.application.openBrowserWindow().activeTab.url=details.url;}},tabs:{getAll:function(callback){var result=[];var wins=safari.application.browserWindows;for(var i=0;i<wins.length;i++){var tabs=wins[i].tabs;for(var j=0;j<tabs.length;j++){result.push(new kango.BrowserTab(tabs[j]));}}
callback(result);},getCurrent:function(callback){callback(new kango.BrowserTab(safari.application.activeBrowserWindow.activeTab));},create:function(details){var focused=(typeof details.focused!='undefined')?details.focused:true;safari.application.activeBrowserWindow.openTab(focused?'foreground':'background').url=details.url;}}});kango.BrowserWindow=function(win){this._window=win;};kango.BrowserWindow.prototype=kango.oop.extend(kango.IBrowserWindow,{_window:null,getTabs:function(callback){var result=[];var tabs=this._window.tabs;for(var i=0;i<tabs.length;i++){result.push(new kango.BrowserTab(tabs[i]));}
callback(result);},getCurrentTab:function(callback){callback(new kango.BrowserTab(this._window.activeTab));},isActive:function(){return(safari.application.activeBrowserWindow==this._window);}});kango.BrowserTab=function(tab){this._tab=tab;};kango.BrowserTab.prototype=kango.oop.extend(kango.IBrowserTab,{_tab:null,getUrl:function(){return this._tab.url||'';},getTitle:function(){return this._tab.title||'';},getDOMWindow:function(){return null;},isActive:function(){return(this._tab==this._tab.browserWindow.activeTab);},navigate:function(url){this._tab.url=url;},dispatchMessage:function(name,data){if(typeof this._tab.page!='undefined'){this._tab.page.dispatchMessage(name,data);}}});kango.browser=new kango.Browser();