/*
Built using Kango - Cross-browser extension framework.
http://kangoextensions.com/
*/
kango.IO=function(){};kango.IO.prototype=kango.oop.extend(kango.IIO,{getExtensionFileUrl:function(filename){return'chrome://kango/content/'+filename;},getFileUrl:function(url){if(url.indexOf(kango.SCHEME)==0||(url.indexOf('http://')==-1&&url.indexOf('https://')==-1)){url=this.getExtensionFileUrl(url.replace(kango.SCHEME,''));}
return url;},getExtensionFileContents:function(filename){var req=new XMLHttpRequest();req.open('GET',this.getExtensionFileUrl(filename),false);req.overrideMimeType('text/plain');req.send(null);return req.responseText;}});kango.io=new kango.IO();