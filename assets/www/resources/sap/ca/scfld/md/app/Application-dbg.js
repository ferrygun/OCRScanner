/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
jQuery.sap.declare("sap.ca.scfld.md.app.Application");
jQuery.sap.require("sap.ca.scfld.md.ApplicationFacade");
jQuery.sap.require("sap.ca.scfld.md.app.ApplicationImplementation");
jQuery.sap.require("sap.m.MessageToast");

sap.ui.base.ManagedObject.extend("sap.ca.scfld.md.app.Application", {

    metadata: {
        properties: {
            identity: "string",
            oViewHook: "string",
            component: "object"
        }
    },
    constructor: function (sId, mSettings) {
        // super
        sap.ui.base.ManagedObject.apply(this, arguments);

        // wait until Core is initialized to create the models & root component
        sap.ui.getCore().attachInit(jQuery.proxy(function () {

            // call the application controller
            this.main();

        }, this));

    },

    createDeviceModel: function () {
        // set device model
        var deviceModel = new sap.ui.model.json.JSONModel({
            isTouch: sap.ui.Device.support.touch,
            isNoTouch: !sap.ui.Device.support.touch,
            isPhone: sap.ui.Device.system.phone,
            isNoPhone: !sap.ui.Device.system.phone,
            listMode: (sap.ui.Device.system.phone) ? "None"
                : "SingleSelectMaster",
            listItemType: (sap.ui.Device.system.phone) ? "Active"
                : "Inactive"
        });
        deviceModel.setDefaultBindingMode(sap.ui.model.BindingMode.OneWay);
        this.getComponent().setModel(deviceModel, "device");
    },

    main: function () {
        var oApplicationImplementation = new sap.ca.scfld.md.app.ApplicationImplementation(
            {
                identity: this.getIdentity(),
                oViewHook: this.getOViewHook(),
                component: this.getComponent()
            });

        this.createDeviceModel();

        // create a static method to retrieve this instance
        // (used by BaseMasterController)
        sap.ca.scfld.md.app.Application.getImpl = jQuery.sap
            .getter(oApplicationImplementation);

        var oApplicationFacade = new sap.ca.scfld.md.ApplicationFacade(
            oApplicationImplementation);

        jQuery.sap.require(this.getIdentity() + ".Configuration");

        var oConfigClass = jQuery.sap.getObject(this.getIdentity() + ".Configuration");
        var oConfiguration = new oConfigClass();
        oConfiguration._setApplicationFacade(oApplicationFacade);

        // show message if in demo mode
        if (oApplicationImplementation.isMock()) {
            var msg = "Running in demo mode with mock data";
            sap.m.MessageToast.show(msg, {
                duration: 1000
            });
        }

        oApplicationImplementation.startApplication(oConfiguration);

    }

});