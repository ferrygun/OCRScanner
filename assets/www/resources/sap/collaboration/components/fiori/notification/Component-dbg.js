/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 * 
 * (c) Copyright 2009-2017 SAP SE. All rights reserved
 */

jQuery.sap.require("sap.collaboration.library");
jQuery.sap.require("sap.collaboration.components.utils.CommonUtil");
jQuery.sap.require("sap.ui.core.UIComponent");
jQuery.sap.require("sap.ui.commons.Button");
jQuery.sap.declare("sap.collaboration.components.fiori.notification.Component");
jQuery.sap.require("sap.m.MessageBox");

/**
* Constructor for the notification component
* @since version 1.18
* @constructor
* @param {sap.ui.core.URI} [oDataServiceUrl] The OData service URL needed for the notification component, the default value is "/sap/opu/odata/sap/SM_INTEGRATION_SRV"
* @param {sap.ui.core.int} [numberOfNotifications] This is the maximum number of notifications to be displayed. The default value is 10.
* @param {sap.ui.core.int} [transitionInterval] This is the amount of time in seconds a notification is displayed before the next notification is displayed. The default value is 10.
* @param {sap.ui.core.int} [refreshInterval] This is the amount of time in seconds before calling the backend to update the notifications. The default value is 300.
* @param {sap.ui.core.URI} notificationsTargetUrl When a user clicks on the component, a new browser tab will open at this URL.
* 
* @class Notification Component
*
* A Notification Component is a ui5 component that displays a SAP Jam member's latest notifications.
* 
* This component refreshes itself when the number of seconds specified in the <tt>refreshInterval</tt> parameter elapses.
* When refreshing, the backend is called to obtain the latest notifications.
* @name sap.collaboration.components.fiori.notification.Component
* @public
* @deprecated Since version 1.26.0.
* There is no replacement for this control. The Fiori Launchpad now provides its own implementation
* for this control. This control was never meant to be used directly by third parties.  
*/
sap.ui.core.UIComponent.extend("sap.collaboration.components.fiori.notification.Component",
		/** @lends sap.collaboration.components.fiori.notification.Component */ {		
	
		metadata: {
			properties: {
				oDataServiceUrl:		{type: "sap.ui.core.URI", defaultValue: "/sap/opu/odata/sap/SM_INTEGRATION_SRV"},
				numberOfNotifications:	{type: "int", defaultValue: 10},
				transitionInterval:		{type: "int", defaultValue: 10},
				refreshInterval:		{type: "int", defaultValue: 300},
				notificationsTargetUrl: {type: "sap.ui.core.URI"}
			}
		},
		
		/**
		* Initialization of the Component
		* @private
		*/
		init: function(){
			this.iMillisecondsPerSecond = 1000;
			this.oCommonUtil = new sap.collaboration.components.utils.CommonUtil();			
			this.oLangBundle = this.oCommonUtil.getLanguageBundle();
			
			this.sStyleClassPrefix = "sapClbNotif";
			
		},
		
		/**
		* Invoked before the Component is rendered.
		* It calls the setGroupsData() function. Refer to the setGroupsData() for the JSDoc 
		* @private
		*/
		onBeforeRendering: function(){
			
		},
		
		/**
		* Called when the Component has been rendered 
		* Creates the sharing View or rerender it
		* @function
		* @private
		*/
		onAfterRendering: function(){
			// log properties
			jQuery.sap.log.debug("Notification Component properties:", this.mProperties.toString(), 
					"sap.collaboration.components.fiori.notification.Component.onAfterRendering()");
			jQuery.sap.log.debug("oDataServiceUrl: " + this.getODataServiceUrl());
			jQuery.sap.log.debug("numberOfNotifications: " + this.getNumberOfNotifications());
			jQuery.sap.log.debug("transitionInterval: " + this.getTransitionInterval());
			jQuery.sap.log.debug("refreshInterval: " + this.getRefreshInterval());
			jQuery.sap.log.debug("notificationsTargetUrl: " + this.getNotificationsTargetUrl());
			if (!this.oNotificationView) {
				this.oNotificationView = sap.ui.view({
					id: this.getId() + "_NotificationView",
					viewData: {
						controlId: 	this.getId(), 
						langBundle: this.oLangBundle,
						oDataServiceUrl: this.getODataServiceUrl(),
						numberOfNotifications: this.getNumberOfNotifications(), 
						transitionInterval:	this.getTransitionInterval() * this.iMillisecondsPerSecond,
						refreshInterval: this.getRefreshInterval() * this.iMillisecondsPerSecond,
						notificationsTargetUrl: this.getNotificationsTargetUrl(),
						styleClassPrefix : this.sStyleClassPrefix
					}, 
					type: sap.ui.core.mvc.ViewType.JS, 
					viewName: "sap.collaboration.components.fiori.notification.Notification"
				});
//				var button = new sap.ui.commons.Button();
//				this.oNotificationView.destroy = function(bSuppressInvalidate) {
//					var a = 1;
//				};
//				button.destroy =  function(bSuppressInvalidate) {
//					var b = 1;
//				};
//				this.addAggregation("view", this.oNotificationView);
//				this.addAggregation("view", button);
			}
			
			this.oNotificationView.placeAt(this.getId());
//			setTimeout(this.destroy.bind(this), 5000);
		},
		
		/**
		* Called when the Component is destroyed. Use this one to free resources and finalize activities.
		* Destroys the sharing view
		* @private
		*/
		exit: function() {
			this.deactivateNotificationRefreshAndTransition();
			// destroy the view in case the component is destroyed as the view will not be destroyed by default. It's not in the aggregation of the component.
			this.oNotificationView.destroy();
		},
		
		/**
		 * Renders the outer HTML for the Component
		 * @param {sap.ui.core.RenderManager} oRm The RenderManager that can be used for writing to the render output buffer
		 * @private
		 */
		render: function(oRm){
			oRm.write("<div id='" + this.getId() + "'");
			oRm.addClass(this.sStyleClassPrefix + "Component");
			oRm.addClass(this.sStyleClassPrefix + "CursorPointer");
			oRm.writeClasses();
			oRm.write(">");
			oRm.write("</div>");
		},
		
		/**
		 * When this function is called, the automatic refresh and transition are deactivated.
		 * @private
		 */
		deactivateNotificationRefreshAndTransition : function() {
			this.oNotificationView.getController().deactivateNotificationTransition();
			this.oNotificationView.getController().deactivateNotificationRefresh();
		}
	}
);
