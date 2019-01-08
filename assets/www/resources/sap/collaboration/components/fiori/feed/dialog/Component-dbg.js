/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 * 
 * (c) Copyright 2009-2017 SAP SE. All rights reserved
 */

jQuery.sap.require("sap.collaboration.library");
jQuery.sap.require("sap.collaboration.components.utils.CommonUtil");
jQuery.sap.require("sap.collaboration.components.utils.JamUtil");
jQuery.sap.require("sap.collaboration.components.utils.OdataUtil");
jQuery.sap.require("sap.ui.core.UIComponent");

jQuery.sap.declare("sap.collaboration.components.fiori.feed.dialog.Component");

/**
* Constructor for the Feed Dialog Component.
* @since version 1.16
* @constructor
* @param {object} businessObject A JSON object passed to the Feed Dialog Component.
* This object represents business related information, such as a sales order, an opportunity, etc. It contains the following properties:
* <ul>
* 	<li><tt>{string} appContext</tt>: The application context.  Example: "CRM", "CB", "SD", etc.</li>
* 	<li><tt>{string} odataServicePath</tt>: The path to the OData Service and the Service name.  Example: "/sap/opu/odata/sap/APPLICATION_SRV".</li>
* 	<li><tt>{string} collection</tt>: The name of the OData Collection. Example: "Account", "Opportunity", etc.</li>
* 	<li><tt>{string} key</tt>: The key to identify a particular instance of the Business Object. It can be a simple ID or a compound key. Example: "123", "ObjectID='123'", "ObjectID='123',ObjectType='BUS000123'", etc.</li>
* 	<li><tt>{string} name</tt>: The short name of the Business Object. Example: "Sales Order 123", "Opportunity 123", "Account 123", etc.</li>
* 	<li><tt>{string} ui_url</tt>: The URL to navigate to the same business object in the application.</li>
* </ul>
* @param {sap.ui.core.URI} [oDataServiceUrl] <b>[DEPRECATED]</b> The OData service URL needed for the Feed Dialog Component, the default value is <tt>"/sap/opu/odata/sap/SM_INTEGRATION_SRV".</tt>
* @param {sap.collaboration.FeedType} [feedType] <b>[DEPRECATED]</b> The type of feed to be displayed.
* @param {string} [groupIds] <b>[DEPRECATED]</b> A comma separated list of group IDs.
* @param {object} [object] <b>[DEPRECATED]</b> A JSON object passed to the Feed Dialog Component. Use <b><tt>businessObject</tt></b> instead.
* This object represents business related information, such as a sales order, an opportunity, etc. It contains the following properties:
*		<ul>
*			<li><tt>id</tt>: The Business Object ID to be posted in the SAP Jam Feed. It needs to be an OData URL containing the relative path to the object in the back-end.</li>
*			<li><tt>type</tt>: the type of the business object. It can be any text or it can be the OData meta data URL to the object Entity Type.</li>
*			<li><tt>name</tt> (optional): the description of the business object to be displayed in SAP Jam, i.e. "SO 57746", "Opportunity 123", etc.</li>
*			<li><tt>ui_url</tt> (optional): the URL to navigate to the same business object in the application.</li>
*		</ul>
* Note: The object is passed by reference, which means that the attributes will be modified in the original object, for example, when the URLs contained in the id and type attributes are mapped (via OData call).
*
* @class Feed Dialog Component
*
* A Feed Dialog Component is a ui5 component that applications can use to render the feed widget view in a dialog 
* in order to discuss information in SAP JAM by adding and replying to feed posts related to a specific Business Object.
* 
* @deprecated Since version 1.34.0. For new integrations and existing implementations running on release 1.32 or later, use the Group Feed component (sap.collaboration.components.feed.Component), Business Object mode(sap.collaboration.FeedType.BusinessObjectGroups). Note that the Group Feed component does not display the full public feed for the object in SAP Jam (object wall), but rather is restricted to the feed for the object within a specific group (group object wall).
* @name sap.collaboration.components.fiori.feed.dialog.Component
* @extends sap.ui.core.UIComponent
* @public
*/
sap.ui.core.UIComponent.extend("sap.collaboration.components.fiori.feed.dialog.Component",
		/** @lends sap.collaboration.components.fiori.feed.dialog.Component */ {
		/**
		 * The Component class has the following properties, contained in <tt>metadata.properties</tt>:
		 * <ol>
		 * 	 <li><tt>{object} businessObject</tt>: the representation of a business object.</li>
		 * 	 <li><tt>{sap.ui.core.CSSSize}</tt> <strong>width</strong> - The width of the component. The default value is an empty string "". </li>
		 *   <li><tt>{sap.ui.core.CSSSize}</tt> <strong>height</strong> - The height of the component. The default value is an empty string "". </li>
		 *   <li><tt>{string}</tt> <strong>feedType</strong> - <b>[DEPRECATED]</b> The feed type for the JAM widget.  The available types are in @link sap.collaboration.FeedType.</li>
		 *   <li><tt>{string}</tt> <strong>groupIds</strong> - <b>[DEPRECATED]</b> The IDs of the group to display in the widget.</li>
		 *   <li><tt>{object}</tt> <strong>object</strong> - <b>[DEPRECATED]</b> The encapsulation of a Business Object.
		 * </ol>
		 * @property
		 * @private
		 */

		metadata: {
			includes: ["../../../resources/css/Sharing.css"],
			properties: {
				width: 		 			{type: "sap.ui.core.CSSSize", defaultValue: "575px"}, // Value defined by Central UX. Internal Message 3216022/2013
				//We need to pass a value in pixels, otherwise the dialog won't render correctly
				height:		 			{type: "sap.ui.core.CSSSize", defaultValue: "605px"}, // Value defined by Central UX. Internal Message 3216022/2013
				feedType:				{type: "string", defaultValue: sap.collaboration.FeedType.object},
				groupIds:				{type: "string"},
				object:					{type: "object"}, 
				businessObject:			{type: "object"} //appContext, oDataServicePath, collection, key, name, ui_url
			},
			
			aggregations: {
			},
			
			events: {
			}
		},

		systemSettings: {
			oDataServiceUrl: "/sap/opu/odata/sap/SM_INTEGRATION_V2_SRV",
			oCollaborationHostRestService: "/sap/bc/ui2/smi/rest_tunnel/Jam//v1",
			oCollaborationHostODataService: "/sap/bc/ui2/smi/rest_tunnel/Jam/api/v1/OData"
		},
		
		/**
		* Initialization of the Component.<br>
		* This method overrides its parent in order to initialize member variables and utility classes.
		* The default values were specified by the Central UX Team (Internal Message 3216022/2013).
		* @private
		*/
		init: function(){
			this.oCommonUtil = new sap.collaboration.components.utils.CommonUtil();
			this.oJamUtil = new sap.collaboration.components.utils.JamUtil();
			this.oLangBundle = this.oCommonUtil.getLanguageBundle();
			
			this.sJamUrl = undefined;
			this.sJamToken = undefined;
			this.oOdataModel = undefined;
			this.oODataUtil = undefined;
			this.oBusinessObject = {};

			sap.ui.core.UIComponent.prototype.init.apply(this);
		},
		
		/**
		* Contract for passing the settings to the Component.
		* @public
		* @param {object} oSettings A JSON object containing the following attributes:
		* 		<ul>
		* 			<li><tt>{object} businessObject</tt>: the representation of a business object.</li>
		* 			<li><tt>{sap.collaboration.FeedType} <b>[DEPRECATED]</b> feedType</tt>: the type of feed to be displayed.</li>
		* 			<li><tt>{string} <b>[DEPRECATED]</b> [groupIds?]</tt>: a comma separated list of group IDs.</li>
		* 			<li><tt>{object} <b>[DEPRECATED]</b> object</tt>: the representation of a business object. Use <tt>businessObject</tt> instead</li>
		* 		</ul>
		*/
		setSettings : function(oSettings) {
			if(oSettings){
				this.setFeedType(oSettings.feedType);
				this.setGroupIds(oSettings.groupIds);
				
				//The object passed in the settings needs to be cloned in order to make it a local variable of the component,
				//otherwise, the original object in the settings is changed (i.e. when url mapping is done), because it is being passed by reference.
				//The cloning is done using jQuery "deep" cloning.
				//The object is directly assigned to the mProperties of the component because the setter is not working properly.
				//The object should also be cloned during construction.
				//Example: this.mProperties.object = jQuery.extend(true, {}, oSettings.object);
				this.setObject(oSettings.object);
				this.setBusinessObject(oSettings.businessObject);
			} else {
				var oErrorSettingsUndefined = new Error("Settings object is undefined");
            	jQuery.sap.log.error(oErrorSettingsUndefined.stack);
			}
		},
		
		/**
		 * Open the Feed Dialog.
		 * @public
		 */
		open : function(){
			// log properties
			this._logComponentProperties();
	        
			try{
					this._validateInputParameters(this.mProperties);
					this._createFeedDialog();
					this._requestWidgetData();
					this.oFeedDialog.open();
			} catch (oError){
					jQuery.sap.log.error(oError.stack);
					this.oCommonUtil.displayError();
			}	
			
		},
		
		
		/**
		* Invoked before the Component is rendered.
		* @private
		*/
		onBeforeRendering: function(){
		},
		
		/**
		* Called when the Component has been rendered 
		* @function
		* @private
		*/
		onAfterRendering: function(){
		},
		
		/**
		 * Renders the outer HTML for the Component
		 * @param {sap.ui.core.RenderManager} oRm The RenderManager that can be used for writing to the render output buffer
		 * @private
		 */
		render: function(oRm){
		},
		
		/**
		 * Initializes the OData needed by the feed widget:
		 * The model and the OData Util class. 
		 * Calls the corresponding functions to create and execute the batch requests to retrieve the necessary data for the component as well as to parse the batch results.
		 * Calls the corresponding function to create and execute the AJAX request to retrieve the SAP Jam single use token.
		 * If both the batch request and AJAX request are successful, the Feed Dialog Component (Feed View and the Feed Dialog Control) is then created.
		 * @private
		 */
		_requestWidgetData: function(){
			var sCSRFToken = this._getCSRFToken();
			
			var self = this;
			var bAsync = true;
			var sCollaborationHostRestService = this.systemSettings.oCollaborationHostRestService;

			this._initOData();
			
			//Logic for object and external Object
           if(this.getObject()){
        	   this._getObjectWithoutMapping();
           } else if(this.getBusinessObject()) {
        	   this._getObjectWithMapping();
           }
           
			// Create, execute and parse the AJAX request asynchronously
			// The AJAX request is to get the token from SAP Jam and if successful, set the variable sJamToken to the retrieved token
			var fnAjaxCallback = function() {
				if (this.readyState == 4) {
					if(this.status == 201){
						self.sJamToken = this.responseXML.getElementsByTagName('single_use_token')[0].attributes[0].value;
						//check if the Jam URL from the batch request is retrieved, if yes, then create the View, the Dialog, and open it.
						if(self.sJamUrl && self.oBusinessObject.odata_url && self.oBusinessObject.metadata_url){
							self._createFeedView();
							self.oFeedDialog.addContent(self.oFeedView);
							setTimeout(function(){self.oFeedDialog.setBusy(false);}, 3000);
						}
					}
					else{
						var sError = "The single use token from SAP Jam was not returned successfully";
						jQuery.sap.log.error(sError, "", "sap.collaboration.components.utils.JamUtil.getJamSinglelUseTokens()");
						if(self.oFeedDialog.isOpen() === true){
							self.oFeedDialog.close();
						}
						self.oCommonUtil.displayError();
					}
				}
			};
			
			this.oJamUtil.getJamSinglelUseTokens(sCollaborationHostRestService, fnAjaxCallback, bAsync, sCSRFToken);
		},
		
		/**
		 * Backwards Compatibility to get the host url, and external url for object id and type using batch.
		 * @private
		 */
		_getObjectWithoutMapping : function(){
			var self = this;
			var bAsync = true;
			var aBatchRequests = [];
			
			// Create, execute and parse the batch requests asynchronously
			var fnParseBatchResults = function(aBatchResults){
				self._parseBatchResults(aBatchResults);
				//check if the single use token from the AJAX request is retrieved, if yes, then create the View, the Dialog, and open it.
				if(self.sJamToken){
					self._createFeedView();
					self.oFeedDialog.addContent(self.oFeedView);
					setTimeout(function(){self.oFeedDialog.setBusy(false);}, 3000);
				}
			};
			
			var fnBatchErrorCallback = function(oErrorBatchFailed){
            	jQuery.sap.log.error(oErrorBatchFailed, "", "sap.collaboration.components.fiori.feed.dialog.Component._getObjectWithoutMapping(), fnBatchErrorCallback()");
            	throw oErrorBatchFailed;
			};
			
			aBatchRequests = this._createBatchRequests();												
			this.oODataUtil.executeODataBatchRequest(this.oOdataModel, aBatchRequests, fnParseBatchResults, bAsync, fnBatchErrorCallback);
		},
		
		/**
		 * Map internal to external object and get the Jam URL
		 * @private
		 */
		_getObjectWithMapping : function(){
			var self = this;
			var getJamUrlPromise = new jQuery.Deferred();
			getJamUrlPromise.done(function(sJamURL){
			   self.sJamUrl = sJamURL;
			});
		   
			var getMappedObjectPromise = new jQuery.Deferred();
			getMappedObjectPromise.done(function(oMappedObject){
			   self._setMappedObject(oMappedObject);
			});
		   
			jQuery.when(getJamUrlPromise, getMappedObjectPromise).fail(function(sStatusCode){
			   if(self.oFeedDialog && self.oFeedDialog.isOpen()){
				   self.oFeedDialog.close();
			   }
			   self.oCommonUtil.displayError();
			});
		   
			this.oODataUtil.getJamUrl(this.oOdataModel, getJamUrlPromise);
			this.oODataUtil.getExternalObjectMapping(this.oOdataModel, this.getBusinessObject(), getMappedObjectPromise);
		},
		
		/**
		 * Set mapped object to member business object
		 * @param oMappedObject
		 * @private
		 */
		_setMappedObject : function (oMappedObject){
			var self = this;
			this.oBusinessObject.id = oMappedObject.Exid;
			this.oBusinessObject.type = oMappedObject.ObjectType;
			this.oBusinessObject.odata_url = this.oBusinessObject.id;
			this.oBusinessObject.metadata_url = this.oBusinessObject.type;
			// Synchronizing getExternalObjectMapping with getJamSingleUseToken
			if(this.sJamToken){
				this._createFeedView();
				this.oFeedDialog.addContent(this.oFeedView);
				setTimeout(function(){self.oFeedDialog.setBusy(false);}, 3000);
			}
		},
		
		/**
		 * Initialize the OData Model and the OData Util Classes
		 * @private
		 */
		_initOData : function(){
			// The variable asJson is used instead of just passing the boolean value 
			// to explain what is the effect of passing true to the ODataModel Constructor
			var asJson = true;    
			//Using a variable for better maintenance and debugging
			var sODataServiceUrl = this.systemSettings.oDataServiceUrl;
			// Initialize the OData Model
			if(!this.oOdataModel){
				this.oOdataModel = new sap.ui.model.odata.ODataModel(sODataServiceUrl, asJson);
			}
            if(!this.oOdataModel.oMetadata.oMetadata){
            	var oErrorMetadataUndefined = new Error("Metadata is undefined");
            	jQuery.sap.log.error(oErrorMetadataUndefined, "", "sap.collaboration.components.fiori.feed.dialog.Component._requestWidgetData()");
            	throw oErrorMetadataUndefined;
            }		            	
			
            // Initialize the OData utility class to create batch calls
            if(!this.oODataUtil){
            	this.oODataUtil = new sap.collaboration.components.utils.OdataUtil();
            }
		},
		
		/**
		 * Returns a CSRF token from SAP Jam
		 * @return {string} CSRF token
		 * @private
		 */
		_getCSRFToken: function(){
			var sCSRFToken = "";
			var oCollaborationHostODataService = this.systemSettings.oCollaborationHostODataService;
			
			var fnAjaxCallback = function(oData) {
				if (this.readyState == 4) {
					if(this.status == 200){
							sCSRFToken = this.getResponseHeader('x-csrf-token');
					}
				}
			};
			this.oJamUtil.getCSRFToken(oCollaborationHostODataService, fnAjaxCallback, false);
			return sCSRFToken;
		},
		
		/**
		 * Creates batch requests for the different feed types.
		 * @return {array} aBatchRequests - An array of batch requests
		 * @private
		 */
		_createBatchRequests : function(){
			var self = this;
			var aBatchRequests = [];
			
			if (!self.sJamUrl){
				aBatchRequests.push(self.oODataUtil.createJamUrlBatchOperation(self.oOdataModel));
			}
			aBatchRequests = aBatchRequests.concat(self._createExternalUrlBatchRequest(self.oODataUtil, self.getObject()));
			
			return aBatchRequests;
		},
				
		/**
		 * Creates a batch request to get the external URL mapping for a business object.
		 * @param {sap.collaboration.components.utils.OdataUtil} oODataUtil An object containing a reference to the OData Util Class
		 * @param {object} oBusinessObject a Business Object containing the URLs that need to be mapped
		 * @return {array} aBatchOperations an array containing the batch operations
		 * @private
		 */
		_createExternalUrlBatchRequest: function(oODataUtil, oBusinessObject){
			var self = this;
			var aBatchOperations = [];
			
			if(oODataUtil && oBusinessObject){
				if(oBusinessObject.id){
					aBatchOperations.push(oODataUtil.createExternalOdataUrlBatchOperation(self.oOdataModel, oBusinessObject.id));
				}
				if(oBusinessObject.type){
					aBatchOperations.push(oODataUtil.createExternalOdataUrlBatchOperation(self.oOdataModel, oBusinessObject.type));
				}				
			}
			
			return aBatchOperations;
		},
		
		/**
		 * Callback function to parse the results from the batch request.<br>
		 * Assumption: the results are returned in the same order as the requests.<br>
		 * The values from the batch results will be assigned to member variables to be used later when the Feed View is created.
		 * @param {array} aBatchResults An array containing the batch results to be parsed
		 * @private
		 */
		_parseBatchResults : function(aBatchResults){
			var self = this;
			var i = 0;
			
			if (!self.sJamUrl){
				if(aBatchResults[i].error){
					throw new Error(aBatchResults[i].error);
				} else {
						self.sJamUrl = aBatchResults[i][self.oODataUtil.OdataUtilConstants.EndPoint.GetCollaborationHostUrl].URL;
				}
				i++;
			}
					
			if(aBatchResults[i].error){
				throw new Error(aBatchResults[i].error);
			} else {
				self.oBusinessObject.id = aBatchResults[i][self.oODataUtil.OdataUtilConstants.EndPoint.GetExternalODataURL].URL;
				self.oBusinessObject.odata_url = self.oBusinessObject.id;
			}
			i++;
			
			if(aBatchResults[i].error){
				throw new Error(aBatchResults[i].error);
			} else {
				self.oBusinessObject.type = aBatchResults[i][self.oODataUtil.OdataUtilConstants.EndPoint.GetExternalODataURL].URL;
				self.oBusinessObject.metadata_url = self.oBusinessObject.type;
			}
		},
		
		/**
		 * Creates the View that wraps the Feed Widget (<tt>sap.collaboration.components.fiori.feed.commons.Detail</tt>).
		 * @private
		 */
		_createFeedView : function() {
			var self = this;
			if(!self.oFeedView){					
				self.oFeedView  = sap.ui.view({
					id: self.getId() + "_FeedView", 
					height: "100%",
					viewData : {
						controlId: self.getId(),
						jamURL:	self.sJamUrl,
						jamToken: self.sJamToken,
						appType: sap.collaboration.AppType.widget,
						feedType: self.getFeedType(),
						groupIds: self.getGroupIds(),
						businessObject: self.oBusinessObject,
						langBundle: self.oLangBundle
					}, 
					type: sap.ui.core.mvc.ViewType.JS, 
					viewName: "sap.collaboration.components.fiori.feed.commons.Detail"
				});
			} else{
				//If the Feed View already exists, we pass the new settings
				self.oFeedView.getController().sFeedType = self.getFeedType();
				self.oFeedView.getViewData().groupIds = self.getGroupIds();
				self.oFeedView.getController().oBusinessObject = self.oBusinessObject;
			}
		},
		
		/**
		 * Creates the Dialog Mobile Control (sap.m.Dialog), defining the sections (title, content and button), 
		 * as well as its properties (height, stretch, etc.) and passes the view in the content.
		 * @private
		 */
		_createFeedDialog: function() {
			var self = this;
				
			if (!this.oFeedDialog){
				this.oFeedDialog = new sap.m.Dialog(this.getId() + "FeedDialog", {
					title: this.oLangBundle.getText("FEED_DIALOG_TITLE"),
					stretch: false,
					contentWidth: this.getWidth(),
					contentHeight: this.getHeight(),
					content: [],
					endButton:
						new sap.m.Button({
							text: this.oLangBundle.getText("CLOSE_BUTTON_TEXT"),
							press : function() {
								self.oFeedDialog.close();
							}
						})
				}); 
			
				if(sap.ui.Device.system.phone){
					this.oFeedDialog.setStretch(true);
				}
			}
			
			this.oFeedDialog.setBusy(true);
		},
		
		/**
		 * Validate input parameters before creating the view, initializing OData, making server calls etc.
		 * @private
		 * @throws {error} oErrorIncorrectInputParameters - Error thrown when the validation on input parameters fail.
		 */
		_validateInputParameters : function(oInputParameters){
			var oErrorIncorrectInputParameters;
			
			//Validations are applied in the sequence they appear, throwing an error the moment a validation fails.  If all the validations pass then continue execution.
			//Using object or external object
			
			if(!oInputParameters){
				oErrorIncorrectInputParameters = new Error("Input paremeters are undefined");
            	jQuery.sap.log.error(oErrorIncorrectInputParameters.stack);
            	throw oErrorIncorrectInputParameters;
			}else if(oInputParameters.businessObject){
				var businessObject = oInputParameters.businessObject;
				if(jQuery.isEmptyObject(businessObject)){//
					oErrorIncorrectInputParameters = new Error("Business Object is empty");
	            	jQuery.sap.log.error(oErrorIncorrectInputParameters.stack);
	            	throw oErrorIncorrectInputParameters;
				}
				if(!businessObject.appContext){
					oErrorIncorrectInputParameters = new Error("Application context is undefined");
	            	jQuery.sap.log.error(oErrorIncorrectInputParameters.stack);
	            	throw oErrorIncorrectInputParameters;
				}
				if(!businessObject.odataServicePath){
					oErrorIncorrectInputParameters = new Error("OData Service Path is undefined");
	            	jQuery.sap.log.error(oErrorIncorrectInputParameters.stack);
	            	throw oErrorIncorrectInputParameters;
				}
				if(!businessObject.collection){
					oErrorIncorrectInputParameters = new Error("Collection is undefined");
	            	jQuery.sap.log.error(oErrorIncorrectInputParameters.stack);
	            	throw oErrorIncorrectInputParameters;
				}
				if(!businessObject.key){
					oErrorIncorrectInputParameters = new Error("Key is undefined");
	            	jQuery.sap.log.error(oErrorIncorrectInputParameters.stack);
	            	throw oErrorIncorrectInputParameters;
				}
				if(!businessObject.name){
					oErrorIncorrectInputParameters = new Error("Name is undefined");
	            	jQuery.sap.log.error(oErrorIncorrectInputParameters.stack);
	            	throw oErrorIncorrectInputParameters;
				}
			} else if(oInputParameters.object){
				var object = oInputParameters.object;
				if(jQuery.isEmptyObject(object)){
					oErrorIncorrectInputParameters = new Error("Business Object is empty");
	            	jQuery.sap.log.error(oErrorIncorrectInputParameters.stack);
	            	throw oErrorIncorrectInputParameters;
				}
				if(!object.id){
					oErrorIncorrectInputParameters = new Error("Object is undefined");
	            	jQuery.sap.log.error(oErrorIncorrectInputParameters.stack);
	            	throw oErrorIncorrectInputParameters;
				}
				if(!object.type){
					oErrorIncorrectInputParameters = new Error("Missing Object Type");
	            	jQuery.sap.log.error(oErrorIncorrectInputParameters.stack);
	            	throw oErrorIncorrectInputParameters;
				}
			} else {
				oErrorIncorrectInputParameters = new Error("Neither an Object nor a Business Object was passed");
            	//jQuery.sap.log.error(oErrorIncorrectInputParameters.stack); It will be logged by the calling function (open)
            	throw oErrorIncorrectInputParameters;
			}
		},
		
		/**
		 * Log the component properties
		 * @private
		 */
		_logComponentProperties : function(){
			jQuery.sap.log.debug("Share Component properties:", "", 
			"sap.collaboration.components.fiori.dialog.Component._logComponentProperties()");
			jQuery.sap.log.debug("width: " + this.getWidth());
	        jQuery.sap.log.debug("height: " + this.getHeight());
	        jQuery.sap.log.debug("oDataServiceUrl: " + this.systemSettings.oDataServiceUrl);
	        jQuery.sap.log.debug("feedType: " + this.getFeedType());
	        jQuery.sap.log.debug("groupIds: " + this.getGroupIds());
	        jQuery.sap.log.debug("object: " + JSON.stringify(this.getObject()));
	        jQuery.sap.log.debug("businessObject: " + JSON.stringify(this.getBusinessObject()));
		}

	}
);
