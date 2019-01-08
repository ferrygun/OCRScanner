sap.ui.define([
	"jquery.sap.global",
	"sap/ui/base/ObjectPool"
], function (jQuery, ObjectPool) {

	function PoolableWorker() {
		var sPath = jQuery.sap.getModulePath("sap.ui.thirdparty", "/klay.js");
		this._worker = new Worker(sPath);
	}

	PoolableWorker.prototype.getWorker = function () {
		return this._worker;
	};

	PoolableWorker.prototype.init = function () {
	};

	PoolableWorker.prototype.reset = function () {
		this._worker.onmessage = null;
		this._worker.onerror = null;
	};

	/**
	 * A wrapper over klayjs which tries to send the layout job to worker thread if available.
	 *
	 * @static
	 * @private
	 * @since 1.50
	 * @alias sap.suite.ui.commons.networkgraph.layout.KlayWrapper
	 */
	var KlayWrapper = {};

	KlayWrapper._pool = new ObjectPool(PoolableWorker);

	KlayWrapper.layout = function (oParameters) {
		if (Worker) {
			var oPooledWorker = KlayWrapper._pool.borrowObject(),
				oWorker = oPooledWorker.getWorker();
			oWorker.postMessage({
				graph: oParameters.graph,
				options: oParameters.options
			});
			oWorker.onmessage = function (oData) {
				if (oData.data.stacktrace) {
					oParameters.error(oData.data);
				} else {
					oParameters.success(oData.data);
				}
				KlayWrapper._pool.returnObject(oPooledWorker);
			};
			oWorker.onerror = function (oError) {
				oParameters.error(oError);
				KlayWrapper._pool.returnObject(oPooledWorker);
			};
		} else {
			jQuery.sap.require("sap/suite/ui/commons/networkgraph/layout/klay");
			$klay.layout(oParameters);  // eslint-disable-line no-undef
		}
	};

	return KlayWrapper;
}, true);