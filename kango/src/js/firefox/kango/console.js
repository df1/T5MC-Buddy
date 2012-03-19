/*
Built using Kango - Cross-browser extension framework.
http://kangoextensions.com/
*/
function KangoConsole(){this._consoleService=Components.classes['@mozilla.org/consoleservice;1'].getService(Components.interfaces.nsIConsoleService);}
KangoConsole.prototype={_consoleService:null,log:function(str){if(arguments.length>1){str=kango.string.format.apply(kango.string,arguments);}
this._consoleService.logStringMessage(str);}};kango.console=new KangoConsole();