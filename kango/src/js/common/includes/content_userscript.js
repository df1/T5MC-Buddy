/*
Built using Kango - Cross-browser extension framework.
http://kangoextensions.com/
*/
function KangoUserscriptEngineClient(){}
KangoUserscriptEngineClient.prototype={run:function(win,runAt){runAt=runAt||'document-end';var url=win.document.location.href;var self=this;kango.invokeAsync('kango.userscript.getScripts',url,runAt,function(scripts){for(var i=0;i<scripts.length;i++){self.executeScript(win,scripts[i]);}});},executeScript:function(win,text){var api=new KangoUserscriptApi(win);api['kango']=kango;try{kango.lang.evalInSandbox(win,api,text);}
catch(e){var stack=e.stack||'';kango.console.log('US: '+e.message+'\n'+stack);}}};function KangoUserscriptApi(win){this.window=(typeof XPCNativeWrapper!='undefined')?new XPCNativeWrapper(win):win;this.document=this.window.document;}
KangoUserscriptApi.prototype={window:null,document:null};