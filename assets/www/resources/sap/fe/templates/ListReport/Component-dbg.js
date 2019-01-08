/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
        (c) Copyright 2009-2017 SAP SE. All rights reserved
    
 */

sap.ui.define([
	"jquery.sap.global",
	"sap/fe/core/TemplateAssembler",
	"sap/fe/templates/ListReport/controller/ControllerImplementation",
	"sap/fe/core/AnnotationHelper"
], function (jQuery, TemplateAssembler, ControllerImplementation, AnnotationHelper) {
	"use strict";

	function getMethods(oComponent) {

		var oViewProxy = {};
		return {
			oControllerSpecification: {
				getMethods: ControllerImplementation.getMethods.bind(null, oViewProxy),
				oControllerDefinition: {
					// ---------------------------------------------
					// Extensions
					// ---------------------------------------------
					onBeforeRebindTableExtension: function (oEvent) {
					}
				}
			},
			init: function () {
				var oTemplatePrivate = oComponent.getModel("_templPriv");
				oTemplatePrivate.setProperty("/listReport", {}); // Note that component properties are not yet available here
			},

			preTemplater : function(mParameters, oTemplateUtils){
				var oParameterModel = mParameters.oParameterModel;
				var oMetaModel = oParameterModel.getObject().metaModel;
				var sEntitySetPath = "/" + oParameterModel.getObject().entitySet + "/";
				var aSelectionFields = oMetaModel.getObject(sEntitySetPath + "@com.sap.vocabularies.UI.v1.SelectionFields");
				var aLineItems = oMetaModel.getObject(AnnotationHelper.getLineItemPresentation(oParameterModel).getPath());
				var oConcatPart = {};
				var aPromises = [];
				var oPathChecked = {},
					oAnnotationsChecked = {};
				var oLineItem = {}, oSelectionField = {};
				var aApplyParts, oLabeledElement, oApplyUriEncodeParts;
				var i, j;

				function checkContext(sContextPath) {
					var oContext = {},
						oNewContext;
					sContextPath = sContextPath.split("/").slice(0, -1).join("/");
					if (sContextPath.lastIndexOf("/") > 0) {
						oContext = checkContext(sContextPath);
					}
					oNewContext = oMetaModel.getObject(sContextPath);
					if (oNewContext.$kind === "NavigationProperty" && oNewContext.$Type) {
						oContext[oNewContext.$Type] = true;
					}
					return oContext;
				}
				function resolvePath(sContextPath) {
					if (!oPathChecked[sContextPath]) {
						jQuery.sap.log.debug("Requested: " + sContextPath, "PreTemplater");
						aPromises.push(oMetaModel.requestObject(sContextPath).then(function(context) {
							var oContext;
							//resolve annotations of the property
							resolveAnnotations(sContextPath);
							//determine types and namespaces that are part of the path
							oContext = checkContext(sContextPath);
							if (context.$kind === "NavigationProperty" && context.$Type) {
								oContext[context.$Type] = true;
							}
							return oContext;
						}));
						oPathChecked[sContextPath] = true;
					}
				}
				function resolveAnnotationPath(sContextAnnotationPath) {
					aPromises.push(oMetaModel.requestObject(sContextAnnotationPath).then(function(context) {
						if (context) {
							//resolve DataPoint properties
							if (context.Value && context.Value.$Path && context.Value.$Path.indexOf('/') > 0) {
								resolvePath(sContextAnnotationPath + context.Value.$Path);
							}
							if (context.TargetValue && context.TargetValue.$Path && context.TargetValue.$Path.indexOf('/') > 0) {
								resolvePath(sContextAnnotationPath + context.TargetValue.$Path);
							}
							//resolve Contact properties
							if (context.fn && context.fn.$Path && context.fn.$Path.indexOf('/') > 0) {
								resolvePath(sContextAnnotationPath + context.fn.$Path);
							}
							if (context.photo && context.photo.$Path && context.photo.$Path.indexOf('/') > 0) {
								resolvePath(sContextAnnotationPath + context.photo.$Path);
							}
							if (context.role && context.role.$Path && context.role.$Path.indexOf('/') > 0) {
								resolvePath(sContextAnnotationPath + context.role.$Path);
							}
							if (context.title && context.title.$Path && context.title.$Path.indexOf('/') > 0) {
								resolvePath(sContextAnnotationPath + context.title.$Path);
							}
							if (context.org && context.org.$Path && context.org.$Path.indexOf('/') > 0) {
								resolvePath(sContextAnnotationPath + context.org.$Path);
							}
						}
						return checkContext(sContextAnnotationPath);
					}));
				}
				function resolveAnnotations(sContextPath) {
					var oAnnotationMap, oAnnotation, annotation;
					var oConcatPart;
					var k;
					if (!oAnnotationsChecked[sContextPath]) {
						oAnnotationMap = oMetaModel.getObject(sContextPath + "@");
						for (annotation in oAnnotationMap) {
							oAnnotation = oAnnotationMap[annotation];
							if (oAnnotation.$Path && oAnnotation.$Path.indexOf('/') > 0) {
								resolvePath(sEntitySetPath + oAnnotation.$Path);
							} else if (oAnnotation.$Apply && oAnnotation.$Function === "odata.concat") {
								for (k = 0; k < oAnnotation.$Apply.length; k++) {
									oConcatPart = oAnnotation.$Apply[k];
									if (oConcatPart && oConcatPart.$Path && oConcatPart.$Path.indexOf('/') > 0) {
										resolvePath(sEntitySetPath + oConcatPart.$Path);
									}
								}
							}
						}
						oAnnotationsChecked[sContextPath] = true;
					}
				}

				if (aSelectionFields) {
					for (i = 0; i < aSelectionFields.length; i++) {
						oSelectionField = aSelectionFields[i];
						if (oSelectionField.$PropertyPath && oSelectionField.$PropertyPath.indexOf('/') > 0) {
							// resolveSelectionField(oSelectionField);
							resolvePath(sEntitySetPath + oSelectionField.$PropertyPath);
						}
					}
				}

				if (aLineItems) {
					for (i = 0; i < aLineItems.length; i++) {
						oLineItem = aLineItems[i];
						if (oLineItem.$Type === "com.sap.vocabularies.UI.v1.DataField") {
							//check Value
							if (oLineItem.Value.$Path && oLineItem.Value.$Path.indexOf('/') > 0) {
								resolvePath(sEntitySetPath + oLineItem.Value.$Path);
							} else if (oLineItem.Value.$Path) {
								resolveAnnotations(sEntitySetPath + oLineItem.Value.$Path);
							} else if (oLineItem.Value.$Apply && oLineItem.Value.$Function === "odata.concat") {
								for (j = 0; j < oLineItem.Value.$Apply.length; j++) {
									oConcatPart = oLineItem.Value.$Apply[j];
									if (oConcatPart && oConcatPart.$Path && oConcatPart.$Path.indexOf('/') > 0) {
										resolvePath(sEntitySetPath + oConcatPart.$Path);
									}
								}
							}
							//check Label
							if (oLineItem.Label && oLineItem.Label.$Path && oLineItem.Label.$Path.indexOf('/') > 0) {
								resolvePath(sEntitySetPath + oLineItem.Label.$Path);
							}
							//check Criticality & CriticalityRepresentation
							if (oLineItem.Criticality) {
								if (oLineItem.Criticality.$Path && oLineItem.Criticality.$Path.indexOf('/') > 0) {
									resolvePath(sEntitySetPath + oLineItem.Criticality.$Path);
								}
								if (oLineItem.CriticalityRepresentation && oLineItem.CriticalityRepresentation.$Path && oLineItem.CriticalityRepresentation.$Path.indexOf('/') > 0) {
									resolvePath(sEntitySetPath + oLineItem.CriticalityRepresentationType.$Path);
								}
							}
							//check IconUrl
							if (oLineItem.IconUrl && oLineItem.IconUrl.$Path && oLineItem.IconUrl.$Path.indexOf('/') > 0) {
								resolvePath(sEntitySetPath + oLineItem.IconUrl.$Path);
							}
						} else if (oLineItem.$Type === "com.sap.vocabularies.UI.v1.DataFieldWithIntentBasedNavigation") {
							//check SemanticObject
							if (oLineItem.SemanticObject.$Path && oLineItem.SemanticObject.$Path.indexOf('/') > 0) {
								resolvePath(sEntitySetPath + oLineItem.SemanticObject.$Path);
							}
							//check Action
							if (oLineItem.Action && oLineItem.Action.$Path && oLineItem.Action.$Path.indexOf('/') > 0) {
								resolvePath(sEntitySetPath + oLineItem.Action.$Path);
							}
							//check Value
							if (oLineItem.Value.$Path && oLineItem.Value.$Path.indexOf('/') > 0) {
								resolvePath(sEntitySetPath + oLineItem.Value.$Path);
							} else if (oLineItem.Value.$Path) {
								resolveAnnotations(sEntitySetPath + oLineItem.Value.$Path);
							} else if (oLineItem.Value.$Apply && oLineItem.Value.$Function === "odata.concat") {
								for (j = 0; j < oLineItem.Value.$Apply.length; j++) {
									oConcatPart = oLineItem.Value.$Apply[j];
									if (oConcatPart && oConcatPart.$Path && oConcatPart.$Path.indexOf('/') > 0) {
										resolvePath(sEntitySetPath + oConcatPart.$Path);
									}
								}
							}
							//check Label
							if (oLineItem.Label && oLineItem.Label.$Path && oLineItem.Label.$Path.indexOf('/') > 0) {
								resolvePath(sEntitySetPath + oLineItem.Label.$Path);
							}
							//check Criticality & CriticalityRepresentation
							if (oLineItem.Criticality) {
								if (oLineItem.Criticality.$Path && oLineItem.Criticality.$Path.indexOf('/') > 0) {
									resolvePath(sEntitySetPath + oLineItem.Criticality.$Path);
								}
								if (oLineItem.CriticalityRepresentation && oLineItem.CriticalityRepresentation.$Path && oLineItem.CriticalityRepresentation.$Path.indexOf('/') > 0) {
									resolvePath(sEntitySetPath + oLineItem.CriticalityRepresentationType.$Path);
								}
							}
							//check IconUrl
							if (oLineItem.IconUrl && oLineItem.IconUrl.$Path && oLineItem.IconUrl.$Path.indexOf('/') > 0) {
								resolvePath(sEntitySetPath + oLineItem.IconUrl.$Path);
							}
						} else if (oLineItem.$Type === "com.sap.vocabularies.UI.v1.DataFieldWithUrl") {
							//check Value
							if (oLineItem.Value.$Path && oLineItem.Value.$Path.indexOf('/') > 0) {
								resolvePath(sEntitySetPath + oLineItem.Value.$Path);
							} else if (oLineItem.Value.$Path) {
								resolveAnnotations(sEntitySetPath + oLineItem.Value.$Path);
							} else if (oLineItem.Value.$Apply && oLineItem.Value.$Function === "odata.concat") {
								for (j = 0; j < oLineItem.Value.$Apply.length; j++) {
									oConcatPart = oLineItem.Value.$Apply[j];
									if (oConcatPart && oConcatPart.$Path && oConcatPart.$Path.indexOf('/') > 0) {
										resolvePath(sEntitySetPath + oConcatPart.$Path);
									}
								}
							}
							//check Label
							if (oLineItem.Label && oLineItem.Label.$Path && oLineItem.Label.$Path.indexOf('/') > 0) {
								resolvePath(sEntitySetPath + oLineItem.Label.$Path);
							}
							//check Url
							if (oLineItem.Url.$Path && oLineItem.Url.$Path.indexOf('/') > 0) {
								resolvePath(sEntitySetPath + oLineItem.Url.$Path);
							} else if (oLineItem.Url.$Apply) {
								aApplyParts = oLineItem.Url.$Apply;
								if (oLineItem.Url.$Function === "odata.fillUriTemplate") {
									if (aApplyParts[0].$Path && aApplyParts[0].$Path.indexOf('/') > 0) {
										resolvePath(sEntitySetPath + aApplyParts[0].$Path);
									}
									for (j = 1; j < aApplyParts.length; j++) {
										oLabeledElement = aApplyParts[j].$LabeledElement;
										if (oLabeledElement && oLabeledElement.$Path && oLabeledElement.$Path.indexOf('/') > 0) {
											resolvePath(sEntitySetPath + oLabeledElement.$Path);
										} else if (oLabeledElement && oLabeledElement.$Apply && oLabeledElement.$Function === "odata.uriEncode") {
											oApplyUriEncodeParts = oLabeledElement.$Apply[0];
											if (oApplyUriEncodeParts.$Path && oApplyUriEncodeParts.$Path.indexOf('/') > 0) {
												resolvePath(sEntitySetPath + oApplyUriEncodeParts.$Path);
											}
										}
									}
								} else if (oLineItem.Url.$Function === "odata.concat") {
									for (j = 0; j < oLineItem.Value.$Apply.length; j++) {
										oConcatPart = oLineItem.Value.$Apply[j];
										if (oConcatPart && oConcatPart.$Path && oConcatPart.$Path.indexOf('/') > 0) {
											resolvePath(sEntitySetPath + oConcatPart.$Path);
										}
									}
								}
							}
						} else if (oLineItem.$Type === "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation") {
							//check SemanticObject
							if (oLineItem.SemanticObject.$Path && oLineItem.SemanticObject.$Path.indexOf('/') > 0) {
								resolvePath(sEntitySetPath + oLineItem.SemanticObject.$Path);
							}
							//check Action
							if (oLineItem.Action && oLineItem.Action.$Path && oLineItem.Action.$Path.indexOf('/') > 0) {
								resolvePath(sEntitySetPath + oLineItem.Action.$Path);
							}
							//check RequiresContext
							if (oLineItem.RequiresContext && oLineItem.RequiresContext.$Path && oLineItem.RequiresContext.$Path.indexOf('/') > 0) {
								resolvePath(sEntitySetPath + oLineItem.RequiresContext.$Path);
							}
						} else if (oLineItem.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAnnotation") {
							//check Target
							if (oLineItem.Target.$AnnotationPath && oLineItem.Target.$AnnotationPath.indexOf('/') > 0) {
								resolveAnnotationPath(sEntitySetPath + oLineItem.Target.$AnnotationPath);
							}
							//check Label
							if (oLineItem.Label && oLineItem.Label.$Path && oLineItem.Label.$Path.indexOf('/') > 0) {
								resolvePath(sEntitySetPath + oLineItem.Label.$Path);
							}
						}
					}
				}
				return aPromises;
			}
		};
	}

	return TemplateAssembler.getTemplateComponent(getMethods,
		"sap.fe.templates.ListReport", {
			metadata: {
				properties: {
					"templateName": {
						"type": "string",
						"defaultValue": "sap.fe.templates.ListReport.view.ListReport"
					},
					"tableType": {
						"type": "string",
						"defaultValue": "ResponsiveTable"
					},
					"settingsDialogType": {
						"type": "string",
						"defaultValue": "ViewSettings"
					},
					"filterLiveUpdate": {
						"type": "boolean",
						"defaultValue":"true"
					}
				},
				"manifest": "json"
			}
		});
});
