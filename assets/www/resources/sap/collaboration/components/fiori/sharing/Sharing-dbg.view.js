/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 * 
 * (c) Copyright 2009-2017 SAP SE. All rights reserved
 */

sap.ui.jsview("sap.collaboration.components.fiori.sharing.Sharing", {

	/**
	 * Specifies the Controller belonging to this View. 
	 * In the case that it is not implemented, or that "null" is returned, this View does not have a Controller.
	 * @memberOf Sharing
	 */ 
	getControllerName : function() {
		return "sap.collaboration.components.fiori.sharing.Sharing";
	},

	/**
	 * Is initially called once after the Controller has been instantiated. It is the place where the UI is constructed. 
	 * Since the Controller is given to this method, its event handlers can be attached right away.
	 * Creates and returns a UI5 mobile VBox 
	 * @memberOf Sharing
	 */ 
	createContent : function(oController) {
		var sPrefixId = this.getViewData().controlId;
		
		this.oSharingVBox = new sap.m.VBox(sPrefixId + "_SharingVbox");
		this.createSharingVBoxContent(oController);
		
		return this.oSharingVBox;
	},
	
	/**
	 * Creates the content for the Sharing VBox
	 * @private
	 */
	createSharingVBoxContent : function(oController) {
		var sPrefixId = this.getViewData().controlId;
		var oLangBundle = this.getViewData().langBundle;
		var sJamUrl = this.getViewData().jamUrl;
		
		this.oObjectDisplay = this.getViewData().objectDisplay;
		if(this.oObjectDisplay){
			this.oSharingVBox.addItem(this.oObjectDisplay);
		}
		
		// GROUP SELECTION 
		var oGroupLabel = new sap.m.Label(sPrefixId + "_GroupLabel", {
			text: oLangBundle.getText("GRP_SELECT_LABEL"),
			required : true,
			width: "100%"
		}); 
				
		this.oGroupSelect = new sap.m.Input(sPrefixId + "_GroupSelect",{
			width: "100%",
			type: sap.m.InputType.Text,
			placeholder: oLangBundle.getText("GRP_SELECT_BUTTON_TEXT"),
			showValueHelp: true,
			enabled: true,
			editable: true,
			valueHelpOnly: true,
			valueHelpRequest: function(oControlEvent) {
						oController.onGroupSelectValueHelpPress(oControlEvent);
			},
			ariaLabelledBy: sPrefixId + "_GroupLabel"
		});
		
		var oGroupSelectionLayout = new sap.ui.layout.VerticalLayout(sPrefixId + "_GroupSelectionLayout", {
			width: "100%",
			layoutData: new sap.m.FlexItemData({growFactor: 1}),
		    content: [
						oGroupLabel, 
						this.oGroupSelect
			]
		}).addStyleClass("sharingVBox");
		this.oSharingVBox.addItem(oGroupSelectionLayout);
		
		// ATTACHMENTS 
		var oAttachmentsLabel = new sap.m.Label(sPrefixId + "_AttachmentsLabel", {
			text: oLangBundle.getText("ATTACHMENTS_LABEL"),
			required : false,
			width: "100%"
		}); 
		this.oAttachmentsInput = new sap.m.Input(sPrefixId + "_AttachmentsInput", {
			width: "100%",
			type: sap.m.InputType.Text,
			placeholder: oLangBundle.getText("ATTACHMENTS_FIELD_TEXT",[""]),
			showValueHelp: true,
			enabled: true,
			editable: true,
			valueHelpOnly: true,
			valueHelpRequest: function(oControlEvent) {
				oController.onAttachmentsValueHelpPress(oControlEvent);
			},
			ariaLabelledBy: sPrefixId + "_AttachmentsLabel"
		});
		
		this.AttachmentsInputLayout = new sap.ui.layout.VerticalLayout(sPrefixId + "_AttachmentsInputLayout", {
			width: "100%",
			layoutData: new sap.m.FlexItemData({growFactor: 1}),
		    content: [
						oAttachmentsLabel, 
						this.oAttachmentsInput
			]
		}).addStyleClass("sharingVBox");
		this.oSharingVBox.addItem(this.AttachmentsInputLayout);
			
		// TARGET FOLDER
		var oTargetFolderLabel = new sap.m.Label(sPrefixId + "_TargetFolderLabel", {
			text: oLangBundle.getText("TARGET_FOLDER_LABEL"),
			required : false,
			width: "100%"
		}); 
		
		this.oTargetFolderInput = new sap.m.Input(sPrefixId + "_TargetFolderInput", {
			width: "100%",
			type: sap.m.InputType.Text,
			placeholder: oLangBundle.getText("TARGET_FOLDER_FIELD_TEXT"),
			showValueHelp: true,
			enabled: true,
			editable: true,
			valueHelpOnly: true,
			valueHelpRequest: function(oControlEvent) {
				oController.onTargetFolderValueHelpPress(oControlEvent);
			},
			ariaLabelledBy: sPrefixId + "_TargetFolderLabel"
		});

		this.oTargetFolderInputLayout = new sap.ui.layout.VerticalLayout(sPrefixId + "_TargetFolderInputLayout", {
			width: "100%",
			layoutData: new sap.m.FlexItemData({growFactor: 1}),
		    content: [
						oTargetFolderLabel, 
						this.oTargetFolderInput
			]
		}).addStyleClass("sharingVBox");
		this.oSharingVBox.addItem(this.oTargetFolderInputLayout);
		
		// COMMENTS BOX
		var oNoteLabel = new sap.m.Label(sPrefixId + "_NoteLabel", {
			text: oLangBundle.getText("ADD_NOTE_LABEL"),
			width: "100%"
		}); 
		
		var iObjectId_CharLength;
		this.getViewData().objectId ? iObjectId_CharLength = this.getViewData().objectId.length : iObjectId_CharLength = 0;
		var iNoteTextArea_MaxChar = 1000 - iObjectId_CharLength - 1; // -1 to account for the newline we add as separator bet the Obj Id and the note in the feed
		
		this.oNoteTextArea = new sap.collaboration.components.controls.SocialTextArea(sPrefixId + "_NoteTextArea", {
			initialValue: this.getViewData().objectShare,
			rows: 6,
			width : "100%",
			suggestionPlacement: sap.m.PlacementType.Top,
			maxLength: iNoteTextArea_MaxChar,
			suggest: oController.onSuggestion.bind(oController),
			ariaLabelledBy: sPrefixId + "_NoteLabel"
		});
		
		var oNoteLayout = new sap.ui.layout.VerticalLayout(sPrefixId + "_NoteLayout", {
			width: "100%",
			layoutData: new sap.m.FlexItemData({growFactor: 2}),
		    content: [
						oNoteLabel, 
						this.oNoteTextArea
			]
		}).addStyleClass("sharingVBox");
		this.oSharingVBox.addItem(oNoteLayout);
		
		// ATTACHMENTS ONLY CHECKBOX
		this.oAttachmentCB = new sap.m.CheckBox(sPrefixId + "_AttchmentCB",{
			text: oLangBundle.getText("SHARE_ATTACHMENTS_ONLY_LABEL"),
			enabled: false,
			select: function(){
				oController.onAttachmentCheckBoxSelected();
			},
			ariaLabelledBy: sPrefixId + "_AttchmentCB"
		});
		this.oSharingVBox.addItem(this.oAttachmentCB);
	}
});