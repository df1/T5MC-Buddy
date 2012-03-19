/*
Built using Kango - Cross-browser extension framework.
http://kangoextensions.com/
*/
function KangoInvokeAsyncModule(){}
KangoInvokeAsyncModule.prototype.init=function(target){var MESSAGE_RESULT='KangoInvokeAsyncModule_result';var MESSAGE_INVOKE='KangoInvokeAsyncModule_invoke';var MESSAGE_INVOKE_CALLBACK='KangoInvokeAsyncModule_invokeCallback';var requests={};var request_counter=0;var generateId=function(){return(Math.random()+request_counter++);};var isCallbackFunction=function(func){return(typeof func.call!='undefined'&&typeof func.apply!='undefined')};var processInvokeAsyncMessage=function(message,source){var response={id:message.id,result:null,error:null};try{response.result=target.lang.invoke(message.method,message.params);}
catch(e){response.error=e.toString();}
if(message.id!=null){source.dispatchMessage(MESSAGE_RESULT,response);}};var processInvokeAsyncCallbackMessage=function(message,source){var response={id:message.id,result:null,error:null};try{message.params.push(function(result){response.result=result;if(message.id!=null){source.dispatchMessage(MESSAGE_RESULT,response);}});target.lang.invoke(message.method,message.params);}
catch(e){response.error=e.toString();if(message.id!=null){source.dispatchMessage(MESSAGE_RESULT,response);}}};var processResultMessage=function(message,source){if(typeof message.id!='undefined'&&typeof requests[message.id]!='undefined'){var callbackDetails=requests[message.id];if(message.error==null&&isCallbackFunction(callbackDetails.onSuccess)){callbackDetails.onSuccess(message.result);}
else if(isCallbackFunction(callbackDetails.onError)){callbackDetails.onError(message.error);}
delete requests[message.id];}};target.addEventListener('message',function(event){var handlers={};handlers[MESSAGE_INVOKE]=processInvokeAsyncMessage;handlers[MESSAGE_INVOKE_CALLBACK]=processInvokeAsyncCallbackMessage;handlers[MESSAGE_RESULT]=processResultMessage;var message=event.data;for(var handlerName in handlers){if(handlerName==event.name){handlers[handlerName](message,event.source);break;}}});var invokeAsyncInternal=function(isCallbackInvoke,args){args=Array.prototype.slice.call(args,0);var callback=args[args.length-1];var callbackDetails={onSuccess:function(){},onError:function(error){kango.console.log('Error during async call method '+args[0]+'. Details: '+error);},isCallbackInvoke:isCallbackInvoke,isNotifyInvoke:false};if(isCallbackFunction(callback)){callbackDetails.onSuccess=function(response){callback(response);};args[args.length-1]=callbackDetails;}
else{callbackDetails.isNotifyInvoke=true;args.push(callbackDetails);}
target.invokeAsyncEx.apply(target,args);};target.invokeAsyncEx=function(methodName){var callbackDetails=arguments[arguments.length-1];var messageName=(callbackDetails.isCallbackInvoke)?MESSAGE_INVOKE_CALLBACK:MESSAGE_INVOKE;var args=Array.prototype.slice.call(arguments,1,arguments.length-1);var id=null;if(!callbackDetails.isNotifyInvoke){id=generateId();requests[id]=callbackDetails;}
target.dispatchMessage(messageName,{id:id,method:methodName,params:args});};target.invokeAsync=function(methodName){invokeAsyncInternal(false,arguments);};target.invokeAsyncCallback=function(methodName){invokeAsyncInternal(true,arguments);};};if(typeof kango!='undefined'&&typeof kango.addModule!='undefined'){kango.addModule(KangoInvokeAsyncModule);}