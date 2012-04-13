/*
Built using Kango - Cross-browser extension framework.
http://kangoextensions.com/
*/
kango.IO=function(){};kango.IO.prototype=kango.oop.extend(kango.IIO,{getFileUrl:function(url){if(url.indexOf(kango.SCHEME)==0||url.indexOf('http://')!=0||url.indexOf('https://')!=0){url=url.replace(kango.SCHEME,'');}
return url;},getExtensionFileContents:function(filename){var req=new XMLHttpRequest();req.open('GET',filename,false);req.overrideMimeType('text/plain');req.send(null);return req.responseText;}});kango.io=new kango.IO();