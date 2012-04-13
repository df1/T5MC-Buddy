/*
Built using Kango - Cross-browser extension framework.
http://kangoextensions.com/
*/
kango.SimpleStorage=function(){this._preferenceBranch=Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefService).getBranch(this.PREFERENCE_BRANCH_NAME);};kango.SimpleStorage.prototype={_preferenceBranch:null,PREFERENCE_BRANCH_NAME:'extensions.kango.storage.',setItem:function(name,value){if(typeof value=='string'){return this._preferenceBranch.setCharPref(name,value);}
else if(typeof value=='number'){return this._preferenceBranch.setIntPref(name,value);}
else if(typeof value=='boolean'){return this._preferenceBranch.setBoolPref(name,value);}
else if(typeof value=='undefined'){return this.removeItem(name);}
return false;},getItem:function(name){var type=this._preferenceBranch.getPrefType(name);if(type==this._preferenceBranch.PREF_STRING){return this._preferenceBranch.getCharPref(name);}
else if(type==this._preferenceBranch.PREF_INT){return this._preferenceBranch.getIntPref(name);}
else if(type==this._preferenceBranch.PREF_BOOL){return this._preferenceBranch.getBoolPref(name);}
return null;},removeItem:function(name){try{return this._preferenceBranch.clearUserPref(name);}
catch(e){return false;}},getKeys:function(){var count={};return this._preferenceBranch.getChildList('',count);},clear:function(){return Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefService).deleteBranch(this.PREFERENCE_BRANCH_NAME);}};kango.simpleStorage=new kango.SimpleStorage();