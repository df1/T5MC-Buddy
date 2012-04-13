/*
Built using Kango - Cross-browser extension framework.
http://kangoextensions.com/
*/
kango.Console=function(){this._consoleService=Components.classes['@mozilla.org/consoleservice;1'].getService(Components.interfaces.nsIConsoleService);};kango.Console.prototype=kango.oop.extend(kango.IConsole,{_consoleService:null,log:function(str){if(arguments.length>1){str=kango.string.format.apply(kango.string,arguments);}
this._consoleService.logStringMessage(str);}});kango.console=new kango.Console();