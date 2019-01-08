/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
        (c) Copyright 2009-2017 SAP SE. All rights reserved
    
 */

sap.ui.define([
	"jquery.sap.global",
	"sap/ui/base/Object",
	"sap/m/MessageToast",
	"sap/m/MessageItem",
	"sap/m/MessageView",
	"sap/ui/layout/form/SimpleForm",
	"sap/ui/model/message/MessageModel",
	"sap/m/NavContainer",
	"sap/m/Page",
	"sap/m/Dialog",
	"sap/m/Button",
	"sap/ui/core/Title",
	"sap/m/Label",
	"sap/m/Text",
	"sap/ui/core/message/Message",
	"sap/m/Toolbar",
	"sap/m/ToolbarSpacer"
], function (jQuery, BaseObject, MessageToast, MessageItem, MessageView, SimpleForm, MessageModel, NavContainer,
			 Page, Dialog, Button, Title, Label, Text, Message, Toolbar, ToolbarSpacer) {
	"use strict";

	function getMethods(oTemplateUtils) {

		function fnHandleRequestFailed(aErrorItems) {
			var aMessages = [];

			function fnNavButtonPress(oEvent) {
				oEvent.getSource().getParent().getParent().getParent().to("errorMessagesPage");
				oEvent.getSource().getParent().getParent().getParent().getParent().getButtons()[0].setVisible(true);
			}

			if (!(aErrorItems instanceof Array)) {
				aErrorItems = Array(aErrorItems);
			}
			var oMessageTemplate = new MessageItem({
				counter: '{counter}',
				title: '{message}',
				subtitle: '{additionalText}',
				longtextUrl: '{descriptionUrl}',
				type: '{type}',
				description: '{description}'
			});

			var oMessageView = new MessageView({
				items: {
					path: '/',
					template: oMessageTemplate
				}
			});

			oMessageView.setModel(sap.ui.getCore().getMessageManager().getMessageModel());

			var oTechnicalDetails = new SimpleForm({
				width: "100%"
			});

			if (aErrorItems.length > 0) {
				if (aErrorItems[0].status) {
					oTechnicalDetails.addContent(
						new Label({
							text: oTemplateUtils.getText("SAPFE_TECHNICAL_DETAILS_HTTP_STATUS"),
							design: "Bold"
						}));
					oTechnicalDetails.addContent(
						new Text({
							text: aErrorItems[0].status
						})
					);
				}
				if (aErrorItems[0].statusText) {
					oTechnicalDetails.addContent(
						new Label({
							text: oTemplateUtils.getText("SAPFE_TECHNICAL_DETAILS_EXCEPTION_CATEGORY"),
							design: "Bold"
						}));
					oTechnicalDetails.addContent(
						new Text({
							text: aErrorItems[0].statusText
						})
					);
				}
				if (aErrorItems[0].error) {
					if (aErrorItems[0].error["@SAP__common.Application"]) {
						oTechnicalDetails.addContent(
							new Title({
								text: oTemplateUtils.getText("SAPFE_TECHNICAL_DETAILS_GROUP_APPLICATION")
							})
						);
						if (aErrorItems[0].error["@SAP__common.Application"].ComponentId) {
							oTechnicalDetails.addContent(
								new Label({
									text: oTemplateUtils.getText("SAPFE_TECHNICAL_DETAILS_COMPONENT_ID"),
									design: "Bold"
								}));
							oTechnicalDetails.addContent(
								new Text({
									text: aErrorItems[0].error["@SAP__common.Application"].ComponentId
								})
							);
						}
						if (aErrorItems[0].error["@SAP__common.Application"].ServiceId) {
							oTechnicalDetails.addContent(
								new Label({
									text: oTemplateUtils.getText("SAPFE_TECHNICAL_DETAILS_ODATA_SERVICE"),
									design: "Bold"
								}));
							oTechnicalDetails.addContent(
								new Text({
									text: aErrorItems[0].error["@SAP__common.Application"].ServiceRepository + "\n"
									+ aErrorItems[0].error["@SAP__common.Application"].ServiceId + "\n"
									+ aErrorItems[0].error["@SAP__common.Application"].ServiceVersion
								})
							);
						}
					}
					oTechnicalDetails.addContent(
						new Title({
							text: "Error Resolution"
						})
					);
					if (aErrorItems[0].error["@SAP__common.TransactionId"]) {
						oTechnicalDetails.addContent(
							new Label({
								text: oTemplateUtils.getText("SAPFE_TECHNICAL_DETAILS_TRANSACTION_ID"),
								design: "Bold"
							}));
						oTechnicalDetails.addContent(
							new Text({
								text: aErrorItems[0].error["@SAP__common.TransactionId"]
							})
						);
					}
					if (aErrorItems[0].error["@SAP__common.Timestamp"]) {
						oTechnicalDetails.addContent(
							new Label({
								text: oTemplateUtils.getText("SAPFE_TECHNICAL_DETAILS_TIMESTAMP"),
								design: "Bold"
							}));
						oTechnicalDetails.addContent(
							new Text({
								text: aErrorItems[0].error["@SAP__common.Timestamp"]
							})
						);
					}
					if (aErrorItems[0].error["@SAP__common.ErrorResolution"]) {
						if (aErrorItems[0].error["@SAP__common.ErrorResolution"].Analysis) {
							oTechnicalDetails.addContent(
								new Label({
									text: oTemplateUtils.getText("SAPFE_TECHNICAL_DETAILS_ANALYSIS"),
									design: "Bold"
								}));
							oTechnicalDetails.addContent(
								new Text({
									text: aErrorItems[0].error["@SAP__common.ErrorResolution"].Analysis
								})
							);
						}
						if (aErrorItems[0].error["@SAP__common.ErrorResolution"].Note) {
							oTechnicalDetails.addContent(
								new Label({
									text: oTemplateUtils.getText("SAPFE_TECHNICAL_DETAILS_SAP_NOTE"),
									design: "Bold"
								}));
							oTechnicalDetails.addContent(
								new Text({
									text: aErrorItems[0].error["@SAP__common.ErrorResolution"].Note
								})
							);
						}
						if (aErrorItems[0].error["@SAP__common.ErrorResolution"].DetailedNote) {
							oTechnicalDetails.addContent(
								new Label({
									text: oTemplateUtils.getText("SAPFE_TECHNICAL_DETAILS_SAP_DETAILED_NOTE"),
									design: "Bold"
								}));
							oTechnicalDetails.addContent(
								new Text({
									text: aErrorItems[0].error["@SAP__common.ErrorResolution"].DetailedNote
								})
							);
						}
					}
					if (aErrorItems[0].error.details && aErrorItems[0].error.details[0] && aErrorItems[0].error.details[0].message) {
						oTechnicalDetails.addContent(
							new Title({
								text: oTemplateUtils.getText("SAPFE_TECHNICAL_DETAILS_GROUP_MESSAGES")
							})
						);
						for (var i = 0; i < aErrorItems[0].error.details.length; i++) {
							oTechnicalDetails.addContent(
								new Label({
									text: oTemplateUtils.getText("SAPFE_TECHNICAL_DETAILS_MESSAGES") + " " + (i + 1),
									design: "Bold"
								}));
							oTechnicalDetails.addContent(
								new Text({
									text: aErrorItems[0].error.details[i].message + ", "
									+ aErrorItems[0].error.details[i].code + ", "
									+ aErrorItems[0].error.details[i]["@SAP__common.Severity"]
								})
							);
							aMessages.push(new Message({
								"message": aErrorItems[0].error.details[i].message,
								"code": aErrorItems[0].error.details[i].code,
								"type": aErrorItems[0].error.details[i]["@SAP__common.Severity"],
								"longtextUrl": aErrorItems[0].error.details[i].longtext_url
							}));
						}
						sap.ui.getCore().getMessageManager().addMessages(aMessages);
					}
				}
			}
			if (!this.errorMessagesPage) {
				this.errorMessagesPage = new Page({
					id: "errorMessagesPage",
					customHeader: [
						new Toolbar({
							design: "Transparent",
							content: [
								new ToolbarSpacer(),
								new sap.m.Title({
									text: oTemplateUtils.getText("SAPFE_ERROR_MESSAGES_PAGE_TITLE")
								}),
								new ToolbarSpacer()
							]
						})
					]
				});
			}
			if (this.errorMessagesPage.getContent()) {
				this.errorMessagesPage.removeAllContent();
			}
			this.errorMessagesPage.addContent(oMessageView);

			if (oTechnicalDetails.getContent().length > 0) {
				if (!this.technicalDetailsPage) {
					this.technicalDetailsPage = new Page({
						id: "technicalDetailsPage",
						customHeader: new Toolbar({
							design: "Transparent",
							content: [
								new Button({
									type: "Back",
									press: fnNavButtonPress
								}),
								new ToolbarSpacer(),
								new sap.m.Title({
									text: oTemplateUtils.getText("SAPFE_TECHNICAL_MESSAGES_PAGE_TITLE")
								}),
								new ToolbarSpacer()
							]
						})
					});
				}
				if (this.technicalDetailsPage.getContent()) {
					this.technicalDetailsPage.removeAllContent();
				}

				this.technicalDetailsPage.addContent(oTechnicalDetails);
			}
			var aPages = [];
			//Adding the pages only if it has content
			if (!!this.errorMessagesPage) {
				aPages.push(this.errorMessagesPage);
			}
			if (!!this.technicalDetailsPage) {
				aPages.push(this.technicalDetailsPage);
			}

			var oNavContainer = new NavContainer({
				height: "100%",
				width: "100%",
				defaultTransitionName: "show",
				pages: aPages
			});

			var oDialog = new Dialog({
				contentWidth: "37.5em",
				contentHeight: "25em",
				showHeader: false,
				state: 'Error',
				content: oNavContainer,
				resizable: true,
				draggable: true,
				ariaLabelledBy: new sap.ui.core.InvisibleText({
					text: oTemplateUtils.getText("SAPFE_ERROR_MESSAGES_PAGE_TITLE")
				}),
				beginButton: new Button({
					press: function () {
						oNavContainer.to("technicalDetailsPage");
						this.setVisible(false);
					},
					text: oTemplateUtils.getText("SAPFE_TECHNICAL_MESSAGES_PAGE_TITLE")
				}),
				endButton: new Button({
					press: function () {
						sap.ui.getCore().getMessageManager().removeAllMessages();
						oDialog.close();
					},
					text: oTemplateUtils.getText("SAPFE_CLOSE")
				}),
				verticalScrolling: false
			});

			if (!this.technicalDetailsPage) {
				oDialog.getBeginButton().setVisible(false);
			}
			oDialog.open();
		}

		function fnHandleSuccess(text) {
			MessageToast.show(text);
		}

		return {
			handleRequestFailed: fnHandleRequestFailed,
			handleSuccess: fnHandleSuccess
		};
	}

	return BaseObject.extend(
		"sap.fe.core.MessageUtils.js", {
			constructor: function (oTemplateUtils) {
				jQuery.extend(this, getMethods(oTemplateUtils));
			}
		});
});
