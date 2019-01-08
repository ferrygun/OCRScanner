/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
jQuery.sap.declare("sap.ca.ui.dialog.factory");
jQuery.sap.require("sap.ca.ui.dialog.Dialog");

sap.ca.ui.dialog.factory = (function() {
	var _oDlgCollection = {};
	
	var _openDialog = function(oDlgInfo, oSettings, fnClose) {
		var oDlg = _oDlgCollection[oDlgInfo.dlgId];
		
		if (jQuery.isEmptyObject(oDlg)){
			oDlg = new sap.ca.ui.dialog.Dialog(oDlgInfo.dlgId, oDlgInfo);
			var oTempCol = {};
			oTempCol[oDlgInfo.dlgId] = oDlg;
			jQuery.extend(_oDlgCollection, oTempCol);
		}
		return oDlg.initAndOpen(oSettings, fnClose);
	};
	
	return {
		showAbout : function(oSettings, fnClose) {
//implementation is removed to Unified Shell
//			_openDialog({
//				dlgId: "DLG_ABOUT",
//				xmlViewId: "CA_VIEW_ABOUT",
//				xmlViewName: "sap.ca.ui.dialog.About",
//				bStretchOnlyOnPhone: true
//			}, jQuery.extend(oSettings, {useragent: navigator.userAgent}), fnClose);
		},
		
		confirm : function(oSettings, fnClose) {
			return _openDialog({
				dlgId: "DLG_CONFIRM",
				xmlViewId: "CA_VIEW_CONFIRM",
				xmlViewName: "sap.ca.ui.dialog.Confirm",
				bWithPadding: true
			}, oSettings, fnClose);
		},
		
		forward : function(fnStartSearch, fnClose) {
			return _openDialog({
				dlgId: "DLG_FORWARD",
				xmlViewId: "CA_VIEW_FORWARD",
				xmlViewName: "sap.ca.ui.dialog.Forward",
				bStretchOnlyOnPhone: true
			}, {startExternalSearch: fnStartSearch}, fnClose);
		},
		
		selectItem : function(oSettings, fnClose) {
			return _openDialog({
				dlgId: "DLG_SLTITEM",
				xmlViewId: "CA_VIEW_SLTITEM",
				xmlViewName: "sap.ca.ui.dialog.SelectItem",
				bStretchOnlyOnPhone: true
			}, oSettings, fnClose);
		},
		
		showLoginDetails : function(oSettings, fnClose) {
//implementation is removed to Unified Shell
//			_openDialog({
//				dlgId: "DLG_LOGIN",
//				xmlViewId: "CA_VIEW_LOGIN",
//				xmlViewName: "sap.ca.ui.dialog.LoginDetails",
//				bStretchOnlyOnPhone: true
//			}, oSettings, fnClose);
		},
		
		showMessageBox : function(oSettings, fnClose) {
			return _openDialog({
				dlgId: "DLG_MSGBOX",
				xmlViewId: "CA_VIEW_MSG",
				xmlViewName: "sap.ca.ui.message.MessageBox",
				bWithPadding: true
			}, oSettings, fnClose);
		},
		
		setDataProperty : function(sDlgId, sPath, oValue) {
			var oDlg = _oDlgCollection[sDlgId];
			if (oDlg) oDlg.setDataProperty(sPath, oValue);
		},
		
		closeDialog : function(sDlgId, oResult) {
			var oDlg = _oDlgCollection[sDlgId];
			if (oDlg) oDlg.close(oResult);
		}
	};
}());

sap.ca.ui.dialog.loginDetails = (function() {
	return {
		open : function(oSettings, fnClose) {
			return sap.ca.ui.dialog.factory.showLoginDetails(oSettings, fnClose);
		}
	};
}());

sap.ca.ui.dialog.about = (function() {
	return {
		open : function(oSettings, fnClose) {
			return sap.ca.ui.dialog.factory.showAbout(oSettings, fnClose);
		}
	};
}());

/**
* @class Provides methods to show a confirmation dialog in the Fiori style.
* 
* <code>sap.ca.ui.dialog.confirmation</code> is a static class, the statement <code>jQuery.sap.require("sap.ca.ui.dialog.factory")</code> 
* needs to be called before the function can be used. Example:
* <pre>
*    jQuery.sap.require("sap.ca.ui.dialog.factory");
*    
*    // provide your callback function, so that you can get informed if the enduser confirms or cancels the dialog
*    var fnClose = function(oResult) {
*        if (oResult) {
*            console.log("isConfirmed:" + oResult.isConfirmed);
*            if (oResult.sNote) {
*                console.log(oResult.sNote);
*            }
*        }
*    }
*    
*    //open the confirmation dialog
*    sap.ca.ui.dialog.confirmation.open({
*        question : "Send your decision on the shopping card submitted by Henry Emerald?",
*        showNote : true,
*        title : "Send",
*        confirmButtonLabel : "Send"
*    }, fnClose);
* </pre>
* 
* @static
* @public
*
* @deprecated This control is deprecated since 1.26 as per central UX requirements. Please use sap.m.Dialog instead.
*/
sap.ca.ui.dialog.confirmation = (function() {
	return {
		/**
		* Opens the confirmation dialog
		* @param {object} [oSettings] settings for the confirmation dialog
		*        <p>The supported settings are:</p>
		*        <p>additionalInformation  : {array} optional, up-to 4 lines can be shown, every line has the structure: {label: "Leave Type", text: "Vacation"}</p>
		*        <p>confirmButtonLabel  {string} text for the confirm button</p>
		*        <p>noteMandatory  :{boolean} optional, default <i>false</i>
		*        <p>question  : {string} the question/action which the user needs to confirm</p>
		*        <p>showNote  : {boolean} default <i>true</i>
		*        <p>title  : {string} title of the dialog
		* @param {function} [fnClose] the function will be called if the confirmation dialog is closed.
		*        <p>there are 2 default values can be retrieved:</p>
		*        <p>isConfirmed : {boolean} <i>true</i> if the user confirms the action; <i>false</i> if the user cancels the dialog</p>
		*        <p>sNote : {string} the note text provided by the user</p>
		* @public
		* @name sap.ca.ui.dialog.confirmation#open
		* @function
		*/
		open : function(oSettings, fnClose) {
			return sap.ca.ui.dialog.factory.confirm(oSettings, fnClose);
		}
	};
}());

sap.ca.ui.dialog.forwarding = (function() {
	return {
		start : function(fnStartSearch, fnClose) {
			return sap.ca.ui.dialog.factory.forward(fnStartSearch, fnClose);
		},
		
		setFoundAgents : function(arrAgents) {
			sap.ca.ui.dialog.factory.setDataProperty("DLG_FORWARD", "/agents", arrAgents);
		}
	};
}());

sap.ca.ui.dialog.selectItem = (function() {
	return {
		open : function(oSettings, fnClose) {
			return sap.ca.ui.dialog.factory.selectItem(oSettings, fnClose);
		}
	};
}());