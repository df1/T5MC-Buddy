/*
Built using Kango - Cross-browser extension framework.
http://kangoextensions.com/
*/
kango.addEventListener(kango.event.Uninstall,function(){window.addEventListener('beforeunload',function(){kango.storage.clear();},false);});