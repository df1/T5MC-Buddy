/*
Built using Kango - Cross-browser extension framework.
http://kangoextensions.com/
*/
kango.ui.BrowserButton=function(details){if(this._getContainerElem()==null){this._insertButton();}
kango.ui.Button.call(this,document.getElementById(this._buttonId),details);};kango.ui.BrowserButton.prototype=kango.oop.extend(kango.ui.Button,{_buttonId:'kango-ui-browserButton',_containerId:'kango-ui-browserButton-container',_getContainerElem:function(){return document.getElementById(this._containerId);},_insertButton:function(){var afterId='search-container';var navBar=document.getElementById('nav-bar');var curSet=navBar.currentSet.split(',');if(curSet.indexOf(this._containerId)==-1){var pos=curSet.indexOf(afterId)+1||curSet.length;navBar.currentSet=curSet.slice(0,pos).concat(this._containerId).concat(curSet.slice(pos)).join(',');document.persist(navBar.id,'currentset');try{BrowserToolboxCustomizeDone(true);}
catch(e){}}}});