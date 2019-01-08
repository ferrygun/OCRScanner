/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */
// Provides the Core class.
sap.ui.define([
	"jquery.sap.global", "sap/ui/base/ManagedObject"
], function(jQuery, ManagedObject) {
	"use strict";

	/**
	 * @class Core Class of the SAP UI VK Library.
	 *
	 * This class boots the Core framework and makes it available for the application
	 * via method <code>sap.ui.vk.getCore()</code>.
	 *
	 * Example:
	 * <pre>
	 *
	 *   var vkCore = sap.ui.vk.getCore();
	 *
	 * </pre>
	 *
	 * @final
	 * @private
	 * @author SAP SE
	 * @version 1.52.8
	 * @extends sap.ui.base.ManagedObject
	 * @alias sap.ui.vk.Core
	 * @since 1.50.0
	 */
	var Core = ManagedObject.extend("sap.ui.vk.Core", /** @lends sap.ui.vk.Core.prototype */ {
		metadata: {
			publicMethods: [
				"registerClass"
			]
		},

		constructor: function() {
			// Make this class only available once.
			if (sap.ui.vk.getCore && sap.ui.vk.getCore()) {
				return sap.ui.vk.getCore();
			}

			ManagedObject.call(this);

			/**
			 * Retrieve the {@link sap.ui.vk.Core Core} instance for the current window.
			 * @returns {sap.ui.vk.Core} the API of the current Core instance.
			 * @public
			 * @function
			 * @since 1.50.0
			 */
			sap.ui.vk.getCore = jQuery.sap.getter(this);

			this._classes = []; // a list of classes
		}
	});


	/**
	 * Registers class to send events when instances of the class are created or about to be destroyed.
	 *
	 * @param {function} classObject The class object to register.
	 * @returns {sap.ui.vk.Core} <code>this</code> to allow method chaining.
	 * @public
	 * @since 1.50.0
	 */
	Core.prototype.registerClass = function(classObject) {
		if (this._classes.indexOf(classObject) >= 0) {
			return this;
		}

		var that = this,
		    fullClassName = classObject.getMetadata().getName(),
		    eventClassNameCreated = fullClassName + "-created",
		    eventClassNameDestroying = fullClassName + "-destroying",
		    baseRegister = classObject.prototype.register,
		    baseDeregister = classObject.prototype.deregister;

		classObject.prototype.register = function() {
			if (baseRegister) {
				baseRegister.call(this);
			}
			that.fireEvent(eventClassNameCreated, { object: this });
		};
		classObject.prototype.deregister = function() {
			that.fireEvent(eventClassNameDestroying, { object: this });
			if (baseDeregister) {
				baseDeregister.call(this);
			}
		};

		this._classes.push(classObject);

		return this;
	};

	return new Core();
});
