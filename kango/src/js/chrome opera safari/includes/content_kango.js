/*
Built using Kango - Cross-browser extension framework.
http://kangoextensions.com/
*/
var kango={event:{Message:'message'}};kango.lang={evalInSandbox:function(win,api,text){for(var key in api){arguments.callee[key]=api[key];}
eval('(function(){'+text+'})()');}};kango.console={log:function(str){if(typeof opera!='undefined'){opera.postError(str);}
else{console.log(str);}}};kango.xhr={send:function(request,callback){var contentType=request.contentType;if(contentType=='xml'||contentType=='json'){request.contentType='text';}
kango.invokeAsyncCallback('kango.xhr.send',request,function(data){if(data.response!=''){if(contentType=='json'){try{data.response=JSON.parse(data.response);}
catch(e){data.response=null;}}
else if(contentType=='xml'){var DOMParserClass=null;if(typeof DOMParser!='undefined'){DOMParserClass=DOMParser;}
else{DOMParserClass=window.DOMParser;}
var parser=new DOMParserClass();data.response=parser.parseFromString(data.response,'text/xml');}}
data.contentType=contentType;callback(data);});}};kango._init=function(runAt){if(typeof kango.dispatchMessage=='undefined'){this._initMessaging();}
var usclient=new KangoUserscriptEngineClient();usclient.run(window,runAt);};