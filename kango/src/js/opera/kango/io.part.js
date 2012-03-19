/*
Built using Kango - Cross-browser extension framework.
http://kangoextensions.com/
*/
KangoIO.prototype.getExtensionFileContents=function(filename){var req=new XMLHttpRequest();req.open('GET',filename,false);req.overrideMimeType('text/plain');req.send(null);return req.responseText;};KangoIO.prototype.getFileUrl=function(url){if(url.indexOf(kango.SCHEME)==0||url.indexOf('http://')!=0||url.indexOf('https://')!=0){url=url.replace(kango.SCHEME,'');}
return url;};