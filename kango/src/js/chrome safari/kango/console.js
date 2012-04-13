/*
Built using Kango - Cross-browser extension framework.
http://kangoextensions.com/
*/
kango.Console=function(){};kango.Console.prototype=kango.oop.extend(kango.IConsole,{log:function(str){if(arguments.length>1){str=kango.string.format.apply(kango.string,arguments);}
console.log(str);}});kango.console=new kango.Console();