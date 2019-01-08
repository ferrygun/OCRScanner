/**
 * This is a Web Worker wrapper around D3 force algorithm.
 */
/* eslint-disable */
// This section fakes global object so that D3 thinks it's in normal browser.
var D3,
	document = {
		createElement: function () {
			return {
				style: {
					setProperty: function() {
					}
				}
			};
		},
		documentElement: {
			matches: function () {
			},
			style: {}
		}
	},
	window = {
		navigator: {}
	};

function define(oD3) {
	D3 = oD3;
}

define.amd = true;

function getD3(sD3Source) {
	if (!D3) {
		if (sD3Source.substr(0, 1) != "/") {
			sD3Source = "/" + sD3Source;
		}
		importScripts(sD3Source);
	}
	return D3;
}

onmessage = function (oEvent) {
	var graph = oEvent.data.graph;
	var force = getD3(oEvent.data.sD3Source).layout.force()
		.nodes(graph.nodes)
		.links(graph.links)
		.alpha(oEvent.data.alpha)
		.friction(oEvent.data.friction)
		.charge(oEvent.data.charge)
		.start();

	setTimeout(force.stop, oEvent.data.maximumDuration);

	force.on("end", function () {
		postMessage({graph: graph});
	});
};