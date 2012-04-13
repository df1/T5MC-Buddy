/*
Built using Kango - Cross-browser extension framework.
http://kangoextensions.com/
*/
kango.addEventListener(kango.event.Ready,function(){kango.browser.addEventListener('DOMContentLoaded',function(event){var gm_client=new kango.UserscriptEngineClient();gm_client.run(event.window);});});