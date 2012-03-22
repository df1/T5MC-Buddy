// JSON-RPC Client-server implementation based on messaging
function KangoInvokeAsyncModule() {
}

KangoInvokeAsyncModule.prototype.init = function(target) {
	var MESSAGE_RESULT =            'KangoInvokeAsyncModule_result';
	var MESSAGE_INVOKE =            'KangoInvokeAsyncModule_invoke';
	var MESSAGE_INVOKE_CALLBACK =   'KangoInvokeAsyncModule_invokeCallback';

	var requests = {};
	var request_counter = 0;

	var generateId = function() {
		return (Math.random() + request_counter++);
	};

	var isCallbackFunction = function(func) {
		return (typeof func.call != 'undefined' && typeof func.apply != 'undefined')
	};

	var processInvokeAsyncMessage = function(message, source) {
		var response = {
			id: message.id,
			result: null,
			error: null
		};
		try {
			response.result = target.lang.invoke(message.method, message.params);
		}
		catch(e) {
			response.error = e.toString();
		}
		if(message.id != null) {
			source.dispatchMessage(MESSAGE_RESULT, response);
		}
	};

	var processInvokeAsyncCallbackMessage = function(message, source) {
		var response = {
			id: message.id,
			result: null,
			error: null
		};
		try {
			message.params.push(function(result) {
				response.result = result;
				if(message.id != null) {
					source.dispatchMessage(MESSAGE_RESULT, response);
				}
			});
            target.lang.invoke(message.method, message.params);
		}
		catch(e) {
			response.error = e.toString();
			if(message.id != null) {
				source.dispatchMessage(MESSAGE_RESULT, response);
			}
		}
	};

	var processResultMessage = function(message, source) {
		if(typeof message.id != 'undefined' && typeof requests[message.id] != 'undefined') {
			var callbackDetails = requests[message.id];
			if(message.error == null && isCallbackFunction(callbackDetails.onSuccess)) {
				callbackDetails.onSuccess(message.result);
			}
			else if(isCallbackFunction(callbackDetails.onError)) {
				callbackDetails.onError(message.error);
			}
			delete requests[message.id];
		}
	};

    target.addEventListener('message', function(event) {
		var handlers = {};
		handlers[MESSAGE_INVOKE] = processInvokeAsyncMessage;
		handlers[MESSAGE_INVOKE_CALLBACK] = processInvokeAsyncCallbackMessage;
		handlers[MESSAGE_RESULT] = processResultMessage;
		var message = event.data;
		for(var handlerName in handlers) {
			if(handlerName == event.name) {
				handlers[handlerName](message, event.source);
				break;
			}
		}
	});

	var invokeAsyncInternal = function(isCallbackInvoke, args) {
		args = Array.prototype.slice.call(args, 0);
   	    var callback = args[args.length-1];
		var callbackDetails = {
			onSuccess: function(){},
			onError: function(error) {
				kango.console.log('Error during async call method ' + args[0] + '. Details: ' + error);
			},
			isCallbackInvoke: isCallbackInvoke,
			isNotifyInvoke: false
		};
		if(isCallbackFunction(callback)) {
			callbackDetails.onSuccess = function(response) {
				callback(response);
			};
			args[args.length-1] = callbackDetails;
		}
		else {
			callbackDetails.isNotifyInvoke = true;
			args.push(callbackDetails);
		}
        target.invokeAsyncEx.apply(target, args);
	};

	// first argument - method name, last argument - invoke details
    target.invokeAsyncEx = function(methodName) {
		var callbackDetails = arguments[arguments.length-1];
		var messageName = (callbackDetails.isCallbackInvoke) ? MESSAGE_INVOKE_CALLBACK : MESSAGE_INVOKE;
		var args = Array.prototype.slice.call(arguments, 1, arguments.length-1);
		var id = null;
		if(!callbackDetails.isNotifyInvoke) {
			id = generateId();
			requests[id] = callbackDetails;
		}
        target.dispatchMessage(messageName, {id: id, method: methodName, params: args});
	};

    target.invokeAsync = function(methodName) {
		invokeAsyncInternal(false, arguments);
	};

    target.invokeAsyncCallback = function(methodName) {
		invokeAsyncInternal(true, arguments);
	};
};

// Messaging helper
// TODO: refactor using KangoEventTarget
function KangoMessageTargetModule() {
}

KangoMessageTargetModule.prototype.init = function(target) {

	var listeners = {};

	target.addMessageListener = function(name, listener) {
		if(typeof listener.call != 'undefined' && typeof listener.apply != 'undefined') {
			listeners[name] = listeners[name] || [];
			for(var i = 0; i < listeners[name].length; i++) {
				// listener already registered
				if(listeners[name][i] == listener) {
					return;
				}
			}
			listeners[name].push(listener);
		}
	};

	target.addEventListener('message', function(event) {
		var name = event.name;
		if(typeof listeners[name] != 'undefined') {
			for(var i = 0; i < listeners[name].length; i++) {
				listeners[name][i](event);
			}
		}
	});
};

(function(win) {

	var KangoBrowser = {
	
		userAgent: navigator.userAgent.toLowerCase(),

		getVersion: function() {
			return (this.userAgent.match( /.+(?:rv|it|ra|ie|me)[\/: ]([\d.]+)/ ) || [])[1];
		},
	
		isChrome: function() {
			return (/chrome/.test(this.userAgent));
		},

		isSafari: function() {
			return (/webkit/.test(this.userAgent) && !/chrome/.test(this.userAgent));
		},
	
		isOpera: function() {
			return (/opera/.test(this.userAgent));
		},

		isIe: function() {
			return (/msie/.test(this.userAgent) && !/opera/.test(this.userAgent));
		},

		isFirefox: function() {
			return (/firefox/.test(this.userAgent) && !/(compatible|webkit)/.test(this.userAgent));
		}
	};

	var kango = {
		event: {
			 Message: 'message'
		}
	};

	kango.lang = {
		evalInSandbox: function(win, api, text) {
			for(var key in api) {
				arguments.callee[key] = api[key];
			}
			eval('(function(){' + text + '})()');
		}
	};

	kango.console = {
		log: function(str) {
			if(typeof opera != 'undefined') {
				opera.postError(str);
			}
			else {
				console.log(str);
			}
		}
	};

	// XHR Proxy
	kango.xhr = {
		send: function(request, callback) {
			var contentType = request.contentType;
			if(contentType == 'xml' || contentType == 'json') {
				request.contentType = 'text';
			}
			kango.invokeAsyncCallback('kango.xhr.send', request, function(data) {
				if(data.response != '') {
					if(contentType == 'json') {					
						try {
							data.response = JSON.parse(data.response);
						}
						catch(e) {
							data.response = null;
						}
					}
					else if(contentType == 'xml') {
						var DOMParserClass = null;
						if(typeof DOMParser != 'undefined') {
							DOMParserClass = DOMParser;
						}
						else {
							DOMParserClass = window.DOMParser;
						}
						var parser = new DOMParserClass();
						data.response = parser.parseFromString(data.response, 'text/xml');
					}
				}
				data.contentType = contentType;
				callback(data);
			});
		}
	};

	kango.console.log = function(text){
		kango.invokeAsync('kango.console.log', 'Popup Log: ' + text);
	};

	kango.ui = {};
	kango.ui.popup = {
		close: function() {
			kango.dispatchMessage('ClosePopup');
		}
	};

	function initMessaging() {
		var listeners = [];

		win.addEventListener('message', function(event) {
			var message = JSON.parse(event.data);
			var e = {
				name: message.name,
				data: message.data,
				origin: event.origin,
				source: {
					dispatchMessage: function(name, data) {
						event.source.postMessage(JSON.stringify({name: name, data: data}));
					}
				},
				target: kango
			};
			for(var i = 0; i < listeners.length; i++) {
				listeners[i](e);
			}
		}, false);

		kango.dispatchMessage = function(name, data) {
			win.top.postMessage(JSON.stringify({name: name, data: data}), '*');
		};

		kango.addEventListener = function(type, listener) {
			if(type == 'message') {
				for(var i = 0; i < listeners.length; i++) {
					if(listeners[i] == listener) {
						return;
					}
				}
				listeners.push(listener);
			}
		};
		
		(new KangoInvokeAsyncModule()).init(kango);
		(new KangoMessageTargetModule()).init(kango);
	}
	
	function initKangoProxy() {
		window.kango = kango;
		initMessaging();
	}

	var readyListeners = [];

	function fireReady() {
		for(var i = 0; i < readyListeners.length; i++) {
			readyListeners[i]();		
		}
	}

	// Public API
	win.onKangoReady = function(callback) {
		readyListeners.push(callback);
	};

	// Initialize	
	if(KangoBrowser.isChrome() || KangoBrowser.isSafari() || KangoBrowser.isOpera()) {
		win.addEventListener('load', function() {
			initKangoProxy();
			fireReady();
		}, false);
	}
	else if(KangoBrowser.isIe()) {
		var intervalId = win.setInterval(function() {
			if(typeof win.kango != 'undefined') {
				win.clearInterval(intervalId);
				fireReady();
			}
		}, 10);
	}
	else if(KangoBrowser.isFirefox()) {
		win.addEventListener('DOMContentLoaded', function() {
			fireReady();
		}, false);
	} 
})(window);
