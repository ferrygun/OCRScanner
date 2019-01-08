
(function () {
    "use strict";
    /*global dispatchEvent, document, jQuery, localStorage, sap */

    jQuery.sap.declare("sap.ovp.cards.ActionUtils");

    sap.ovp.cards.ActionUtils = {};

    sap.ovp.cards.ActionUtils.getActionInfo = function(oContext, action, oEntityType) {

        var metaModel = oContext.getModel().getMetaModel();
        var sFunctionName = action.action.split('/')[1];
        var oContextObject = oContext.getObject();
        var actionData = {
            oContext: oContext,
            sFunctionImportPath: action.action,
            sFunctionLabel: action.label,
            oFunctionImport: metaModel.getODataFunctionImport(sFunctionName),
            parameterData: {},
            allParameters: []
        };
        var oParameterValue;

        if (actionData.oFunctionImport.parameter) {
            var keyMap = this._getKeyProperties(oEntityType);
            for (var i = 0; i < actionData.oFunctionImport.parameter.length; i++) {
                var oParameter = actionData.oFunctionImport.parameter[i];
                this._addParamLabel(oParameter, oEntityType, metaModel);
                if (keyMap[oParameter.name]) {
                    oParameter.isKey = true;
                }

                if (typeof oParameter.nullable === 'undefined') {
                    oParameter.nullable = true;// default is not mandatory parameter == could be null
                }
                if (oContextObject.hasOwnProperty(oParameter.name)) {
                    oParameterValue = oContextObject[oParameter.name];
                } else {
                    oParameterValue = "";
                }

                actionData.parameterData[oParameter.name] = oParameterValue;
                actionData.allParameters.push(oParameter);
            }
        }
        return actionData;
    };

    sap.ovp.cards.ActionUtils._getKeyProperties = function(oEntityType){
        var oKeyMap = {};

        if (oEntityType && oEntityType.key && oEntityType.key.propertyRef){
            for (var i = 0; i < oEntityType.key.propertyRef.length; i++) {
                var sKeyName = oEntityType.key.propertyRef[i].name;
                oKeyMap[sKeyName] = true;
            }
        }

        return oKeyMap;
    };

    sap.ovp.cards.ActionUtils._addParamLabel = function (oParameter, oEntityType, metaModel){
        if (oEntityType && oParameter && !oParameter["com.sap.vocabularies.Common.v1.Label"]) {

            var oProperty = metaModel.getODataProperty(oEntityType, oParameter.name, false);
            if (oProperty && oProperty["com.sap.vocabularies.Common.v1.Label"]) {
                // copy label from property to parameter with same name as default if no label is set for function import parameter
                oParameter["com.sap.vocabularies.Common.v1.Label"] = oProperty["com.sap.vocabularies.Common.v1.Label"];
            } else if (oProperty && oProperty["sap:label"]) {
                oParameter["sap:label"] = oProperty["sap:label"];
            }
        }
    };

    sap.ovp.cards.ActionUtils.buildParametersForm = function(actionData, onFieldChangeCB) {

        function getParamLabel(oParameter){
            var sLabel = "";
            if (oParameter["com.sap.vocabularies.Common.v1.Label"]) {
                sLabel = oParameter["com.sap.vocabularies.Common.v1.Label"].String;
            } else if (oParameter["sap:label"]) {
                sLabel = oParameter["sap:label"];
            } else {
                sLabel = oParameter.name;
            }

            return sLabel;
        }

        jQuery.sap.require("sap.ui.layout.form.SimpleForm");
        jQuery.sap.require("sap.ui.comp.smartfield.SmartField");

        var oForm = new sap.ui.layout.form.SimpleForm({
            editable: true
        });
        var aFields = [];

        for (var i = 0; i < actionData.allParameters.length; i++) {
            var oParameter = actionData.allParameters[i];

            var sParameterLabel = getParamLabel(oParameter);
            var sBinding = '{/' + oParameter.name + '}';
            var sJSONType = null;
            var sEdmType = oParameter.type;

            // max length - default undefined if not set in OData metadata
            var iMaxLength = oParameter.maxLength ? parseInt(oParameter.maxLength, 10) : undefined;

            // covers Edm.Byte, Edm.SByte, Edm.Boolean, Edm.Int16, Edm.Int32, Edm.Time
            if (sEdmType === 'Edm.Boolean') {
                sJSONType = sap.ui.comp.smartfield.JSONType.Boolean;
            } else if (sEdmType === 'Edm.Byte' || sEdmType === 'Edm.SByte' || sEdmType === 'Edm.Int16' || sEdmType === 'Edm.Int32') {
                sJSONType = sap.ui.comp.smartfield.JSONType.Integer;
            } else {
                sJSONType = sap.ui.comp.smartfield.JSONType.String;
            }

            var isMandatory = sap.ovp.cards.ActionUtils._isMandatoryParameter(oParameter);

            var oField = new sap.ui.comp.smartfield.SmartField({
                value: sBinding,
                mandatory: isMandatory,
                jsontype: sJSONType,
                maxLength: iMaxLength,
                editable:!oParameter.isKey
            });
            oField.attachChange(onFieldChangeCB);
            aFields.push(oField);
            var oLabel = new sap.ui.comp.smartfield.SmartLabel();
            oLabel.setRequired(isMandatory && !oParameter.isKey);

            oLabel.setText(sParameterLabel);
            oLabel.setLabelFor(oField);

            oForm.addContent(oLabel);
            oForm.addContent(oField);
        }

        return oForm;
    };

    sap.ovp.cards.ActionUtils.getParameters = function (oParameterModel, functionImport){
        var paramObject = sap.ovp.cards.ActionUtils._validateParametersValue(oParameterModel, functionImport);
        return paramObject.preparedParameterData;
    };

    sap.ovp.cards.ActionUtils.mandatoryParamsMissing = function(oParameterModel, functionImport) {
        var oValidatedParams = sap.ovp.cards.ActionUtils._validateParametersValue(oParameterModel, functionImport);
        return oValidatedParams.missingMandatoryParameters && oValidatedParams.missingMandatoryParameters.length > 0;
    };

    sap.ovp.cards.ActionUtils._validateParametersValue = function(oParameterModel, functionImport) {
        var aMissingMandatoryParameters = [];
        var oModelParameterData = oParameterModel.getObject('/');
        var oPreparedParameterData = {};
        var oValue, isMandatory;
        for (var i = 0; i < functionImport.parameter.length; i++) {
            var oParameter = functionImport.parameter[i];
            var sParameterName = oParameter.name;
            if (oModelParameterData.hasOwnProperty(sParameterName)) {

                oValue = oModelParameterData[sParameterName];
                isMandatory = sap.ovp.cards.ActionUtils._isMandatoryParameter(oParameter);
                if (oValue === undefined || oValue === "") {
                    if (isMandatory) {
                        if (oParameter.type === 'Edm.Boolean'){
                            oPreparedParameterData[sParameterName] = false;
                        } else {
                            aMissingMandatoryParameters.push(oParameter);
                        }
                    }
                } else {
                    oPreparedParameterData[sParameterName] = oValue;
                }
            } else {
                throw new Error("Unknown parameter: " + sParameterName);
            }
        }
        return {
            preparedParameterData: oPreparedParameterData,
            missingMandatoryParameters: aMissingMandatoryParameters
        };
    };

    sap.ovp.cards.ActionUtils._isMandatoryParameter = function(oParameter) {
        return !sap.ovp.cards.ActionUtils._toBoolean(oParameter.nullable);
    };

    sap.ovp.cards.ActionUtils._toBoolean = function(oParameterValue) {
        if (typeof oParameterValue === "string"){
            var oValue = oParameterValue.toLowerCase();
            return !(oValue == "false" || oValue == "" || oValue == " ");
        }

        return !!oParameterValue;
    };
}());
