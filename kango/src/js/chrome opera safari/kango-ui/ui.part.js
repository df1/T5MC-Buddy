/*
Built using Kango - Cross-browser extension framework.
http://kangoextensions.com/
*/
kango.ui._init=function(){var browser_button=kango.getExtensionInfo().browser_button;if(kango.lang.isObject(browser_button)){kango.ui.browserButton=new kango.ui.BrowserButton(browser_button);}
return this.fireEvent(this.event.Ready);};