sap.ui.define([
	"jquery.sap.global",
	"sap/ui/base/ObjectPool"
], function (jQuery, ObjectPool) {

	var D3;

	function getD3() {
		if (!D3) {
			jQuery.sap.require("sap/ui/thirdparty/d3");
			D3 = sap.ui.require("sap/ui/thirdparty/d3");
		}
		return D3;
	}

	function PoolableWorker() {
		var sPath = jQuery.sap.getModulePath("sap.suite.ui.commons.networkgraph.layout", "/D3ForceWorker.js");
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
	 * A wrapper over D3 which tries to send the layout job to worker thread if available.
	 *
	 * @static
	 * @private
	 * @since 1.50
	 * @alias sap.suite.ui.commons.networkgraph.layout.D3ForceWrapper
	 */
	var D3ForceWrapper = {};

	D3ForceWrapper._pool = new ObjectPool(PoolableWorker);
	D3ForceWrapper._d3Path = jQuery.sap.getModulePath("sap.ui.thirdparty", "/d3.js");

	function runLocally(oParameters, resolve) {
		var graph = oParameters.graph;
		var force = getD3().layout.force()
			.nodes(graph.nodes)
			.links(graph.links)
			.alpha(oParameters.alpha)
			.friction(oParameters.friction)
			.charge(oParameters.charge)
			.start();

		setTimeout(force.stop, oParameters.maximumDuration);

		force.on("end", function () {
			resolve(graph);
		});
	}

	D3ForceWrapper.layout = function (oParameters) {
		var bUseWorker = false;
		return new Promise(function (resolve, reject) {
			if (Worker && bUseWorker) {
				var oPooledWorker = D3ForceWrapper._pool.borrowObject(),
					oWorker = oPooledWorker.getWorker();
				oWorker.postMessage({
					sD3Source: D3ForceWrapper._d3Path,
					graph: oParameters.graph,
					alpha: oParameters.alpha,
					friction: oParameters.friction,
					charge: oParameters.charge,
					maximumDuration: oParameters.maximumDuration
				});
				oWorker.onmessage = function (oEvent) {
					D3ForceWrapper._pool.returnObject(oPooledWorker);
					if (oEvent.data.stacktrace) {
						reject(oEvent.data);
					} else {
						resolve(oEvent.data);
					}
				};
				oWorker.onerror = function (oError) {
					reject(oError);
					D3ForceWrapper._pool.returnObject(oPooledWorker);
				};
			} else {
				runLocally(oParameters, resolve);
			}
		});
	};

	return D3ForceWrapper;
}, true);