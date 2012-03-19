/*
Built using Kango - Cross-browser extension framework.
http://kangoextensions.com/
*/
function KangoXHR(){}
KangoXHR.prototype={_paramsToString:function(params){var result='';for(var key in params){if(params.hasOwnProperty(key)){if(result!=''){result+='&';}
result+=key+'='+params[key];}}
return result;},getXMLHttpRequest:function(){return new XMLHttpRequest();},KangoXHRRequest:function(){this.method='GET';this.url='';this.params={};this.headers={};this.async=true;this.contentType='';this.username='';this.password='';},KangoXHRResult:function(){this.response='';this.status=0;},send:function(details,callback){var req=this.getXMLHttpRequest();var method=details.method||'GET';var async=details.async||true;var params=details.params||null;var type=details.contentType||'text';var url=details.url;var username=details.username||'';var password=details.password||'';if(details.url.indexOf(kango.SCHEME)==0){url=kango.io.getExtensionFileUrl(details.url.replace(kango.SCHEME,''));}
function getResult(req,type){var data={response:null,status:0,abort:function(){req.abort();}};if(req.readyState>=2){data.status=req.status;if(req.readyState==4){if(type=='xml'){data.response=req.responseXML;}
else if(type=='json'){try{data.response=JSON.parse(req.responseText);}
catch(e){}}
else{data.response=req.responseText;}
data.abort=function(){};}}
return data;}
function getErrorResult(){return{response:null,status:0,abort:function(){}};}
if(params!=null){if(typeof details.params=='object'){params=this._paramsToString(params);}
if(method=='GET'){url=url+'?'+params;params=null;}}
try{req.open(method,url,async,username,password);}
catch(e){callback(getErrorResult());return getErrorResult();}
if(typeof req.overrideMimeType!='undefined'){if(type=='json'){req.overrideMimeType('application/json');}}
req.onreadystatechange=function(){if(req.readyState==4){if(typeof callback=='function'||(typeof callback.call!='undefined'&&typeof callback.apply!='undefined')){callback(getResult(req,type));}}};if(typeof details.headers=='object'){for(var key in details.headers){if(details.headers.hasOwnProperty(key)){req.setRequestHeader(key,details.headers[key]);}}}
try{req.send(params);}
catch(e){callback(getErrorResult());return getErrorResult();}
return getResult(req,type);}};kango.xhr=new KangoXHR();