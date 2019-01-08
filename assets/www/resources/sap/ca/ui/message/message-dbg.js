/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
jQuery.sap.declare("sap.ca.ui.message.message");
jQuery.sap.require("sap.ca.ui.dialog.factory");
jQuery.sap.require("sap.m.MessageToast");
jQuery.sap.require("sap.ca.ui.utils.resourcebundle");
jQuery.sap.require("sap.ui.core.library");

/**
* @class Provides methods to show messages with type of <b>Success</b>, <b>Error</b>, <b>Warning</b> and <b>Information</b> in a Fiori style.
* 
* <code>sap.ca.ui.message</code> is a static class, the statement <code>jQuery.sap.require("sap.ca.ui.message.message")</code> 
* needs to be called before the function can be used. Example:
* <pre>
*    jQuery.sap.require("sap.ca.ui.message.message");
*    
*    // provide your callback function, if you want to get informed after the user closes the MessageBox
*    var bIsMsgBoxClosed = false;
*    var fnClose = function(){
*        bIsMsgBoxClosed = true;
*    };
*    
*    // show the erorr message in a MessageBox
*    sap.ca.ui.message.showMessageBox({
*        type: sap.ca.ui.message.Type.ERROR,
*        message: "No connection can be established to the backend system ABC",
*        details: "Lorem ipsum dolor sit amet, eum an vidit ..."
*    }, fnClose);
* </pre>
* 
* @static
* @public
* 
* @deprecated This control is deprecated since 1.28 as per central UX requirements. Please use sap.m.MessageBox instead.
*/

sap.ca.ui.message = (function() { 

	var _oType = {
		ERROR : {
			title : sap.ca.ui.utils.resourcebundle.getText("messagetype.error"),
			valueState : sap.ui.core.ValueState.Error
		},
		WARNING : {
			title : sap.ca.ui.utils.resourcebundle.getText("messagetype.warning"),
			valueState : sap.ui.core.ValueState.Warning
		},
		SUCCESS : {
			title : sap.ca.ui.utils.resourcebundle.getText("messagetype.success"),
			valueState : sap.ui.core.ValueState.Success
		},
		INFO : {
			title : sap.ca.ui.utils.resourcebundle.getText("messagetype.info"),
			valueState : sap.ui.core.ValueState.None
		}
	};

	var _getString = function(value) {
		var result = (jQuery.type( value ) === "string") ? value : "";
		// trim string
		return jQuery.trim(result);
	};
	
	var _getState = function(value) {
		var result = (value) ? value : sap.ui.core.ValueState.None;
		return result;
	};
	
	var _getIcon = function(value) {
		var result = (value && value === _oType.INFO) ? "sap-icon://hint" : "";
		return result;
	};
	
	var _initAndOpen = function(oSettings, fnClose) {
		var _oSettings = {};
		if (oSettings) {
			if (oSettings.type) {
				_oSettings.title = _getString(oSettings.type.title);
				_oSettings.state = _getState(oSettings.type.valueState);
				_oSettings.icon = _getIcon(oSettings.type);
				_oSettings.message = _getString(oSettings.message);
				//get and set Details, and Details should be not the same text as Message
				var sDetails = _getString(oSettings.details);
				_oSettings.details = (sDetails && sDetails !== _oSettings.message) ? sDetails : "";
				_oSettings.showLink = (_oSettings.details) ? true : false;
				_oSettings.showDetails = false; //invisible as default
			}
		}
		return sap.ca.ui.dialog.factory.showMessageBox(_oSettings, fnClose);
	};
	
	return {
		/**
		* Shows the messages with type of Success, Error, Warning, Info, in a Fiori style of MessageBox 
		* @param {object} [oSettings] settings for the message box
		*        <p>The supported settings are:</p>
		*        <p>type : {sap.ca.ui.message.Type}</p>
		*        <p>message : {string} short text, the leading and ending white spaces will be removed</p>
		*        <p>details : {string} long text (optional), the detailed information will only be shown if the text is available and 
		*         different to the message text</p>
		* @param {function} [fnClose] the function will be called if the message box is closed 
		* @public
		* @name sap.ca.ui.message#showMessageBox
		* @function
		*/
		showMessageBox : function(oSettings, fnClose) {
			return _initAndOpen(oSettings, fnClose);
		},
		
		/**
		* Shows the success message as a MessageToast
		* @param {string} [sMessage] message to be shown in the MessageToast
		* @public
		* @name sap.ca.ui.message#showMessageToast
		* @function
		*/
		showMessageToast : function(sMessage) {
			sap.m.MessageToast.show(sMessage);
		}, 
		
		/**
		* @class Enumeration of supported message types.
		* 
		* @static
		* @public
		*/
		Type : {
			/**
			* message type: ERROR.
			* @public
			*/
			ERROR : _oType.ERROR,
			/**
			* message type: WARNING.
			* @public
			*/
			WARNING : _oType.WARNING,
			/**
			* message type: SUCCESS.
			* @public
			*/
			SUCCESS : _oType.SUCCESS,
			/**
			* message type: INFO.
			* @public
			*/
			INFO : _oType.INFO
		}
	};
}());
