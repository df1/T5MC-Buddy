/*
Built using Kango - Cross-browser extension framework.
http://kangoextensions.com/
*/
function KangoUserscriptEngine(){this.scripts=[];}
KangoUserscriptEngine.prototype={scripts:[],addScript:function(text){this.scripts.push(new KangoUserScript(text));return true;},clear:function(){this.scripts=[];},getScripts:function(url,runAt){var result=[];for(var i=0;i<this.scripts.length;i++){var script=this.scripts[i];var script_run_at=script.headers['run-at']||'document-end';if(script_run_at==runAt&&this._isIncludedUrl(script,url)&&!this._isExcludedUrl(script,url)){result.push(script.text);}}
return result;},_checkPatternArray:function(array,url){if(typeof array!='undefined'){if(!(array instanceof Array)){array=new Array(array);}
for(var j=0;j<array.length;j++){var pattern=array[j].replace(/\*/g,'(.*)');pattern=pattern.replace(/tld/g,'(.*)');var re=new RegExp(pattern);if(re.test(url)){return true;}}}
return false;},_isIncludedUrl:function(script,url){if(script.headers.include==null){return true;}
return this._checkPatternArray(script.headers.include,url);},_isExcludedUrl:function(script,url){if(script.headers.exclude==null){return false;}
return this._checkPatternArray(script.headers.exclude,url);}};function KangoUserScript(text){this.text=text;this.headers={};this._parseHeaders();}
KangoUserScript.prototype={headers:null,text:null,_parseHeaders:function(){this.headers=this._parseHeadersToHashTable(this.text);if(typeof this.headers.match!='undefined'){if(typeof this.headers.include=='undefined'){this.headers.include=this.headers.match;}
else{this.headers.include.concat(this.headers.match);}}},_parseHeadersToHashTable:function(text){var headers={};var lines=text.split(/\n/);for(var i=0;i<lines.length;i++){var line=lines[i];if(line.indexOf('// ==/UserScript==')==0){break;}
var result=line.match(/\/\/ @(\S+)\s*(.*)/);if(result!=null){var name=result[1];var value=result[2].replace(/\n|\r/g,'');switch(name){case'include':case'exclude':case'match':headers[name]=headers[name]||[];headers[name].push(value);break;default:headers[name]=value;}}}
return headers;}};function KangoUserScriptEngineModule(){}
KangoUserScriptEngineModule.prototype.init=function(){kango.userscript=new KangoUserscriptEngine();var content_scripts=kango.getExtensionInfo().content_scripts;if(typeof content_scripts!='undefined'){for(var i=0;i<content_scripts.length;i++){kango.userscript.addScript(kango.io.getExtensionFileContents(content_scripts[i]));}}};kango.addModule(KangoUserScriptEngineModule);