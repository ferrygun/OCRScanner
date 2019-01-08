/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 * 
 * (c) Copyright 2009-2017 SAP SE. All rights reserved
 */
jQuery.sap.require("sap.ui.core.UIComponent");
jQuery.sap.require("sap.collaboration.components.utils.CommonUtil");

jQuery.sap.declare("sap.collaboration.components.socialprofile.Component");
/** 
* Constructor for the Social Profile Component.
* 
* !!! EXPERIMENTAL !!!
* 
* Accepts an object literal <code>mSettings</code> that defines initial 
* property values, aggregated and associated objects as well as event handlers.
* 
* If the name of a setting is ambiguous (e.g. a property has the same name as an event), 
* then the framework assumes property, aggregation, association, event in that order. 
* To override this automatic resolution, one of the prefixes "aggregation:", "association:" 
* or "event:" can be added to the name of the setting (such a prefixed name must be
* enclosed in single or double quotes).
* 
* The supported settings are:
* <ul>
* <li>Properties
* <ul>
* <li>{@link #getPlacement placement} : sap.m.PlacementType (default: sap.m.PlacementType.Auto) </li>
* <li>{@link #getMemberId memberId} : string </li>
* <li>{@link #getMemberInfo memberInfo} : {object} </li>
* <li>{@link #getOpeningControl openingControl} : {object} </li>
* <li>{@link #getHeight height} : sap.ui.core.CSSSize (default: 380px) </li>
* <li>{@link #getWidth width} : sap.ui.core.CSSSize (default: 300px) </li>
* 
* @param {string} [sId] id for the new control, generated automatically if no id is given 
* @param {object} [mSettings] initial settings for the new control
* 
* @class Social Profile Component
* @extends sap.ui.core.UIComponent
* 
* The Social Profile Component is a SAPUI5 component that applications can use to display the
* profile information for a specific user. The profile information is coming from SAP Jam. 
* 
* @since version 1.25
* @constructor
* @name sap.collaboration.components.socialprofile.Component
* @public
* @experimental The API is not stable and the UI is not finalized. The implementation for this feature is subject to change.
*/
sap.ui.core.UIComponent.extend("sap.collaboration.components.socialprofile.Component",
	/** @lends sap.collaboration.components.socialprofile.Component */
	{
		metadata: {
			version: "1.0",
			includes: ["../resources/css/SocialProfile.css"],
			aggregations: {
	
			},
			properties: {
				placement: {type: "sap.m.PlacementType", group:"Misc", defaultValue: sap.m.PlacementType.Auto},
				memberId: {type: "string", group:"Misc"},
				memberInfo: {type: "object", group:"Misc"},
				openingControl: {type: "object", group:"Misc"},
				height: {type: "sap.ui.core.CSSSize", group:"Dimension", defaultValue: "380px"},
				width: {type: "sap.ui.core.CSSSize", group:"Dimension", defaultValue: "300px"}
			}
		},
		_defaultAttributes: {
			collaborationHostServiceUrl: "/sap/bc/ui2/smi/rest_tunnel/Jam/api/v1/OData", 
			smiServiceUrl: "/sap/opu/odata/sap/SM_INTEGRATION_V2_SRV" 
		},
		/**
		* Initializes the Component instance after creation. [borrowed from sap.ui.core.UIComponent]
		* @protected
		* @memberOf sap.collaboration.components.socialprofile.Component
		*/
		init: function(){
			this._oCommonUtil = new sap.collaboration.components.utils.CommonUtil();
			this._oLangBundle = this._oCommonUtil.getLanguageBundle();
			this._sUserProfileURL;
			this._sCurrentUserEmail;
		},	
		/**
		* Cleans up the component instance before destruction. [borrowed from sap.ui.core.Component]
		* @protected
		* @memberOf sap.collaboration.components.socialprofile.Component
		*/
		exit: function() {
		},
		/**
		* Function is called when the rendering of the Component Container is started. [borrowed from sap.ui.core.UIComponent]
		* @protected
		* @memberOf sap.collaboration.components.socialprofile.Component
		*/
		onBeforeRendering: function(){
		},
		/**
		* Function is called when the rendering of the Component Container is completed. [borrowed from sap.ui.core.UIComponent]
		* @protected
		* @memberOf sap.collaboration.components.socialprofile.Component
		*/
		onAfterRendering: function(){
		},
		/**
		 * Opens the social profile component
		 * @public
		 * @memberOf sap.collaboration.components.socialprofile.Component
		 */
		open: function(){
			try {
				this._logComponentProperties();
				this._validateInputParameters();
				this._createView();
				this._createSocialPopover();
				this._oPopover.openBy(this.getOpeningControl());
			}
			catch (oError) {
				jQuery.sap.log.error(oError.stack);
				this._oCommonUtil.displayError();
			}
		},
		/**
		* Setter for the Component settings
		* @param {object} oSettings A JSON object used to set the component settings, this object should contains the same properties used in the constructor
		* @public
		* @memberOf sap.collaboration.components.socialprofile.Component
		*/
		setSettings: function(oSettings){
			try {
				if (oSettings) {
					this.setPlacement(oSettings.placement);
					this.setMemberId(oSettings.memberId);
					this.setMemberInfo(oSettings.memberInfo);
					this.setOpeningControl(oSettings.openingControl);
					this.setHeight(oSettings.height);
					this.setWidth(oSettings.width);
				}
				
				else {
					throw new Error("Settings object is undefined");
				}
			}
			catch (oError) {
				jQuery.sap.log.error(oError.stack);
				this._oCommonUtil.displayError();
			}
			
		},
		/**
		 * Creates the social profile view
		 * @private
		 * @memberOf sap.collaboration.components.socialprofile.Component
		 */
		_createView: function(){
			var that = this;
			if (!this._oPopoverView) {
				this._oPopoverView = new sap.ui.view({
					id: this.getId() + "_PopoverView",
					viewData : {
						collaborationHostServiceUrl: this._defaultAttributes.collaborationHostServiceUrl,
						smiServiceUrl: this._defaultAttributes.smiServiceUrl,
						langBundle: this._oLangBundle,
						memberId: this.getMemberId(),
						memberInfo: this.getMemberInfo(),
						popoverPrefix: this.getId(),
						afterUserInfoRetrieved : function( oUserData ){
							if (oUserData) {
								that._sUserProfileURL = oUserData.WebURL;
								
								var oJamButton = sap.ui.getCore().byId(that.getId() + "_JamButton");
								oJamButton.setEnabled(true);
								oJamButton.rerender(); // re-render immediately for the focus to set (focus does not work for disabled controls)
								oJamButton.focus();
							}
						}
					},
					type: sap.ui.core.mvc.ViewType.JS, 
					viewName: "sap.collaboration.components.socialprofile.SocialProfile"
				});
			}
			else {
				this._oPopoverView.getViewData().memberId = this.getMemberId();
				this._oPopoverView.getViewData().memberInfo = this.getMemberInfo();
			}
		},
		/**
		 * Creates the responsive popover for the social profile
		 * @private
		 * @memberOf sap.collaboration.components.socialprofile.Component
		 */
		_createSocialPopover: function(){
			var that = this;
			
			if (!this._oPopover) {
				var oHeaderBar = new sap.m.Bar(this.getId() + "_HeaderBar", {
					contentMiddle: new sap.m.Text({ text : this._oLangBundle.getText("SP_TITLE") }).addStyleClass("popoverheader")
				});			
				this._oPopover = new sap.m.ResponsivePopover(this.getId() + "_Popover", {
					placement: this.getPlacement(),
					showCloseButton: true,
					contentHeight: this.getHeight(),
					contentWidth: this.getWidth(),
					content: [this._oPopoverView],
					customHeader: oHeaderBar,
					beginButton: new sap.m.Button(this.getId() + "_JamButton", {
						text: this._oLangBundle.getText("SP_OPEN_JAM_BUTTON"), 
						enabled: false,
						press: function(){
							window.open(that._sUserProfileURL, "_blank");
						}
					}),
					beforeOpen: function(){
						if (that._sCurrentUserEmail !== that.getMemberId()) {
							sap.ui.getCore().byId(that.getId() + "_JamButton").setEnabled(false);
						}
						that._sCurrentUserEmail = that.getMemberId();
					}
				}).addStyleClass("popover");
			}
			
			if (this._oPopover.getPlacement() !== this.getPlacement()) {
				this._oPopover.setPlacement(this.getPlacement());
			}
			if (this._oPopover.getContentHeight() !== this.getHeight()) {
				this._oPopover.setContentHeight(this.getHeight());
			}
			if (this._oPopover.getContentWidth() !== this.getWidth()) {
				this._oPopover.setContentWidth(this.getWidth());
			}
		},
		/**
		 * Log the component properties
		 * @private
		 * @memberOf sap.collaboration.components.socialprofile.Component
		 */
		_logComponentProperties: function(){
			jQuery.sap.log.debug("Social Profile Component properties:", "", "sap.collaboration.components.socialprofile.Component._logComponentProperties()");
			jQuery.sap.log.debug("placement: " + this.getPlacement());
			jQuery.sap.log.debug("memberId: " + this.getMemberId());
			jQuery.sap.log.debug("openingControl: " + this.getOpeningControl());
			jQuery.sap.log.debug("height: " + this.getHeight());
			jQuery.sap.log.debug("width: " + this.getWidth());
		},
		/**
		 * Validate input parameters
		 * @private
		 * @throws Error - an object that contains that error thrown if the validation for the input parameters fails
		 * @memberOf sap.collaboration.components.socialprofile.Component
		 */
		_validateInputParameters: function(){
			if (!this.getMemberId()) {
				throw new Error("MemberId is undefined");
			}
			
			if (!this.getOpeningControl()) {
				throw new Error("Opening control is undefined");
			}
		}
	}
);
/**
 * Getter for property <code>placement</code>.
 * Gets the placement of the Social Profile
 *
 * Default value is <code>sap.m.PlacementType.Auto</code>
 *
 * @return {sap.m.PlacementType} the value of property <code>placement</code>
 * @public
 * @name sap.collaboration.components.socialprofile.Component#getPlacement
 * @function
 */
/**
 * Setter for property <code>placement</code>.
 * Sets the placement of the Social Profile
 * 
 * Default value is <code>sap.m.PlacementType.Auto</code>
 *
 * @param {sap.m.PlacementType} sPlacement  new value for property <code>placement</code>
 * @return {sap.collaboration.components.socialprofile.Component} <code>this</code> to allow method chaining
 * @public
 * @name sap.collaboration.components.socialprofile.Component#setPlacement
 * @function
 */
/**
 * Getter for property <code>memberId</code>.
 * Gets the SAP Jam member id of the user
 *
 * @return {string} the value of property <code>memberId</code>
 * @public
 * @name sap.collaboration.components.socialprofile.Component#getMemberId
 * @function
 */
/**
 * Setter for property <code>memberId</code>.
 * Sets the memberId of the user
 * 
 * @param {string} sMemberId  new value for property <code>memberId</code>
 * @return {sap.collaboration.components.socialprofile.Component} <code>this</code> to allow method chaining
 * @public
 * @name sap.collaboration.components.socialprofile.Component#setMemberId
 * @function
 */
/**
 * Getter for property <code>memberInfo</code>.
 * Gets the SAP Jam member information
 *
 * @return {object} member information <code>memberInfo</code>
 * @public
 * @name sap.collaboration.components.socialprofile.Component#getMemberInfo
 * @function
 */
/**
 * Setter for property <code>memberInfo</code>.
 * Sets the memberInformation of the user
 * 
 * @param {object} oMemberInfo  new value for property <code>memberInfo</code>
 * @return {sap.collaboration.components.socialprofile.Component} <code>this</code> to allow method chaining
 * @public
 * @name sap.collaboration.components.socialprofile.Component#setMemberInfo
 * @function
 */
/**
 * Getter for property <code>openingControl</code>.
 * Gets the opening control for the Social Profile
 *
 * @return {object} the value of property <code>openingControl</code>
 * @public
 * @name sap.collaboration.components.socialprofile.Component#getOpeningControl
 * @function
 */
/**
 * Setter for property <code>openingControl</code>.
 * Sets the opening control for the Social Profile
 * 
 * @param {object} oOpeningControl  new value for property <code>openingControl</code>
 * @return {sap.collaboration.components.socialprofile.Component} <code>this</code> to allow method chaining
 * @public
 * @name sap.collaboration.components.socialprofile.Component#setOpeningControl
 * @function
 */
/**
 * Getter for property <code>height</code>.
 * Gets the height of the Social Profile
 *
 * Default value is <code>380px</code>
 * 
 * @return {sap.ui.core.CSSSize} the value of property <code>height</code>
 * @public
 * @name sap.collaboration.components.socialprofile.Component#getHeight
 * @function
 */
/**
 * Setter for property <code>height</code>.
 * Sets the height of the Social Profile
 * 
 * Default value is <code>380px</code>
 *  
 * @param {string} sHeight  new value for property <code>height</code>
 * @return {sap.collaboration.components.socialprofile.Component} <code>this</code> to allow method chaining
 * @public
 * @name sap.collaboration.components.socialprofile.Component#setHeight
 * @function
 */
/**
 * Getter for property <code>width</code>.
 * Gets the width of the Social Profile
 *
 * Default value is <code>300px</code>
 * 
 * @return {sap.ui.core.CSSSize} the value of property <code>width</code>
 * @public
 * @name sap.collaboration.components.socialprofile.Component#getWidth
 * @function
 */
/**
 * Setter for property <code>width</code>.
 * Sets the width of the Social Profile
 * 
 * Default value is <code>300px</code>
 *  
 * @param {string} sWidth  new value for property <code>width</code>
 * @return {sap.collaboration.components.socialprofile.Component} <code>this</code> to allow method chaining
 * @public
 * @name sap.collaboration.components.socialprofile.Component#setWidth
 * @function
 */