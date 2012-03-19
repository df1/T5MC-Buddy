/*
Built using Kango - Cross-browser extension framework.
http://kangoextensions.com/
*/
function KangoConsole(){}
KangoConsole.prototype={log:function(str){if(arguments.length>1){str=kango.string.format.apply(kango.string,arguments);}
console.log(str);}};kango.console=new KangoConsole();