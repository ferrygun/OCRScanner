jQuery.sap.declare("sap.rules.ui.parser.infrastructure.errorHandling.hrfException");


sap.rules.ui.parser.infrastructure.errorHandling.hrfException = sap.rules.ui.parser.infrastructure.errorHandling.hrfException|| {}; 
sap.rules.ui.parser.infrastructure.errorHandling.hrfException.lib = (function () {
		function HrfMessage (code, params) {
			this.code = code;
			this.params = params;
		}
		
		function setAddToResponse (exception, add) {
			exception.addToResponse = add;
		}
	
		function isAddToResponse (exception) {
			if (exception.hasOwnProperty ('addToResponse')) {
				return exception.addToResponse;
			}
			
			return true;
		}
	
		function isHrfException (exception) {
			if (exception.hasOwnProperty ('name') && exception.name === 'HrfException') {
				return true;
			}
			
			return false;
		}
	
		function isTraced (exception) {
			if (exception.hasOwnProperty ('traced') && exception.traced === true) {
				return true;
			}
			
			return false;
		}
	
		function setTraced (exception, traced) {
			exception.traced = traced;
		}
	
		function setUserData (exception, userData) {
			exception.userData = userData;
		}
	
		function getUserData (exception) {
			if (exception.hasOwnProperty ('userData')) {
				return exception.userData;
			}
			
			return null;
		}
	
		function setHrfMessage (exception, hrfMessage) {
			exception.hrfMessage = hrfMessage;
		}
	
		function getHrfMessage (exception) {
			if (exception.hasOwnProperty ('hrfMessage')) {
				return exception.hrfMessage;
			}
			
			return null;
		}
		
		function trace (exception) {
			if (isTraced (exception)) {
				return;
			}

			if (exception && exception.message && exception.message.length > 0) {
				var traceMassage = "\n----------------------------\n+++ HRF Exception +++\n----------------------------\n";
				traceMassage += exception.message;
				if (exception.stack) {
					traceMassage += "\n\nCall stack:\n----------\n" + 
					exception.stack;
				}
				
				traceMassage += "\n----------------------------\n+++ End of HRF Exception +++\n----------------------------\n";
				jQuery.sap.log.error (traceMassage);
			}

			setTraced (exception, true);
		}
		
		function HrfException (message, addToResponse) {
			this.name = 'HrfException';
			this.message = message;
			if (addToResponse === false) {
				this.addToResponse = false;
			}
			else {
				this.addToResponse = true;

			}

			if (message && message.length > 0) {
				this.stack = (new Error()).stack;
				trace (this);
			}
			else {
				this.stack = '';
			}
		}
		
		HrfException.prototype = Error.prototype;
		HrfException.prototype.constructor = HrfException;

		return {
			HrfException : HrfException,
			HrfMessage : HrfMessage,
			setAddToResponse : setAddToResponse,
			isAddToResponse : isAddToResponse,
			isHrfException : isHrfException,
			setUserData : setUserData,
			getUserData : getUserData,
			isTraced : isTraced,
			setTraced : setTraced,
			setHrfMessage : setHrfMessage,
			getHrfMessage : getHrfMessage,
			trace : trace
		};
}());
