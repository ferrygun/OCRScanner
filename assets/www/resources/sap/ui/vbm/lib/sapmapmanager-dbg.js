// mapmanager object
// Author: Ulrich Roegelein

VBI.MapManager = (function() {
	"use strict";
	/* global VBI */// declare unusual global vars for ESLint/SAPUI5 validation
	var mapmanager = {};
	mapmanager.vbiclass = "MapManager";

	mapmanager.m_nRequest = 0;
	mapmanager.m_tileWidth = 256;
	mapmanager.m_tileHeight = 256;
	mapmanager.m_runningRequests = 0;
	mapmanager.m_limitRequests = 12;
	mapmanager.m_requestQueue = [];
	mapmanager.m_renderQueue = [];
	mapmanager.m_renderRequestID = 0;
	mapmanager.m_failedSendTimer = 0;
	mapmanager.m_renderJunksize = 100;
	// image is loaded

	mapmanager.onAbort = function(event) {
		var image = event.srcElement;

		if (VBI.m_bTrace) {
			VBI.Trace("onAbort " + image.src);
		}
		mapmanager.CheckReqQueue();
		// unlink the image from within the image chain
		mapmanager.UnlinkImage(image);
		mapmanager.CheckTmpCanvas(image.m_Target, image.m_nRequest, image.m_nLayersAbove);
	};

	mapmanager.onFailedSend = function(object) {
		if (VBI.m_bTrace) {
			VBI.Trace("onFailedSend " + object.src);
		}
		mapmanager.m_runningRequests--;
		mapmanager.m_bRequestError = true;

		if (!mapmanager.m_failedSendTimer) {
			mapmanager.m_failedSendTimer = setInterval(function() {
				mapmanager.RetrySending();
			}, 750);
		}
	};

	mapmanager.onError = function(event) {
		var image = event.srcElement;

		if (VBI.m_bTrace) {
			VBI.Trace("onError " + image.src);
		}
		mapmanager.CheckReqQueue();

		var imageRender = null;
		// inherit the fillstyle
		if (image.m_Next != null) {
			image.m_Next.m_FillStyle = image.m_FillStyle;
		}

		if (image.m_Prev == null && image.m_Next != null && image.m_Next.complete == true) {
			imageRender = image.m_Next;
		}
		// unlink the image from within the image chain
		mapmanager.UnlinkImage(image);
		// when the image is the first in current and would be rendered
		if (imageRender != null) {
			mapmanager.m_renderQueue.push(imageRender);
			if (!mapmanager.m_renderRequestID) {
				mapmanager.m_renderRequestID = window.requestAnimationFrame(mapmanager.RenderTiles);
			}
		} else {
			mapmanager.CheckTmpCanvas(image.m_Target, image.m_nRequest, image.m_nLayersAbove);
		}
	};

	mapmanager.onLoad = function(event) {
		var image = event.target;

		if (!image.complete) { //skip odd onload event from IE where image is not loaded yet
			return;
		}
		if (VBI.m_bTrace) {
			VBI.Trace("VBI.MapManager: onLoad  " + image.src);
		}
		mapmanager.CheckReqQueue();

		var bChainComplete = true; // I for myself am complete as I am in onLoad.
		var item;
		for (item = image.m_Prev; item != null; item = item.m_Prev) {
			bChainComplete &= item.complete;
		}
		for (item = image.m_Next; item != null; item = item.m_Next) {
			bChainComplete &= item.complete;
		}
		if (!bChainComplete) {
			if (VBI.m_bTrace) {
				VBI.Trace("VBI.MapManager: onLoad skip as there is a a not yet loaded tile ");
			}
			return;
		}
		// mapmanager.RenderTile(image);
		mapmanager.m_renderQueue.push(image);
		if (!mapmanager.m_renderRequestID) {
			mapmanager.m_renderRequestID = window.requestAnimationFrame(mapmanager.RenderTiles);
		}
	};

	mapmanager.RetrySending = function() {
		clearInterval(mapmanager.m_failedSendTimer);
		mapmanager.m_failedSendTimer = 0;
		mapmanager.m_bRequestError = false;
		mapmanager.m_runningRequests++;
		mapmanager.CheckReqQueue();
	};

	mapmanager.CheckReqQueue = function() {
		while ((mapmanager.m_requestQueue.length) && (!mapmanager.m_bRequestError)) {
			var image = mapmanager.m_requestQueue.shift();
			var targetCanvas = image.m_Target;
			if (image.m_nLOD != targetCanvas.m_nCurrentLOD || targetCanvas.m_bInvalid) {
				mapmanager.UnlinkImage(image);
				mapmanager.CheckTmpCanvas(targetCanvas, image.m_nRequest, image.m_nLayersAbove);
			} else {
				try {
					image.src = image.src2execute;
				} catch (e) {
					mapmanager.m_requestQueue.unshift(image);
					mapmanager.onFailedSend(image);
				}
				return;
			}
		}
		// no further request to be executed
		mapmanager.m_runningRequests--;
	};

	mapmanager.RenderTiles = function() {
		var nCount = Math.min(mapmanager.m_renderQueue.length, mapmanager.m_renderJunksize);
		for (var i = 0; i < nCount; ++i) {
			mapmanager.RenderTile(mapmanager.m_renderQueue.shift());
		}
		mapmanager.m_renderRequestID = mapmanager.m_renderQueue.length > 0 ? window.requestAnimationFrame(mapmanager.RenderTiles) : 0;
	};

	mapmanager.RenderTile = function(image) {
		if (!image.bRendered) {
			var targetCanvas = image.m_Target;
			if ((targetCanvas.m_CanvasRedirect != undefined) && (targetCanvas.m_CanvasRedirRequest == image.m_nRequest)) {
				targetCanvas = targetCanvas.m_CanvasRedirect;
			}

			var currentScene = targetCanvas.m_Scene;
			if (!currentScene) {
				return;
			}

			var canvasWidth = targetCanvas.getPixelWidth();
			var canvasHeight = targetCanvas.getPixelHeight();

			targetCanvas.m_nAppliedRequest = Math.max(targetCanvas.m_nAppliedRequest, image.m_nRequest);
			var context = targetCanvas.getContext('2d');

			var nMaxX = (1 << context.canvas.m_nCurrentLOD);

			var nCol = ((image.m_nReqX - context.canvas.m_nCurrentX) % nMaxX + nMaxX) % nMaxX; // double mod for neg.numbers
			if (nMaxX < currentScene.m_nTilesX) {
				nCol = image.m_nCol + image.m_nXOrigin - context.canvas.m_nCurrentX;
			}

			var nRow = image.m_nReqY - context.canvas.m_nCurrentY;

			// unlink and return when image request is outdated
			if (image.m_bOutdated || (nCol < 0) || (nRow < 0) || (nCol >= image.m_numCol) || (nRow >= image.m_numRow) || (image.m_nLOD != targetCanvas.m_nCurrentLOD || targetCanvas.m_bInvalid)) {
				mapmanager.UnlinkImage(image);

				if (VBI.m_bTrace) {
					VBI.Trace("VBI.MapManager: RenderTile  " + image.src + " is outdated");
				}
				mapmanager.CheckTmpCanvas(targetCanvas, image.m_nRequest, image.m_nLayersAbove);
				return;
			}

			if (VBI.m_bTrace) {
				VBI.Trace("VBI.MapManager: RenderTile  " + image.src);
			}
			// do regular work
			var nWidth = currentScene.m_nWidthCanvas;
			var nHeight = currentScene.m_nHeightCanvas;

			// size it down to prevent from fragments
			targetCanvas.setPixelWidth(nWidth);
			targetCanvas.setPixelHeight(nHeight);

			var tilewidth = nWidth / currentScene.m_nTilesX;
			var tileheight = nHeight / currentScene.m_nTilesY;
			var left = nCol * tilewidth;
			var top = nRow * tileheight;
			var picWidth = image.m_nXExpansion * tilewidth;
			var picHeight = image.m_nYExpansion * tileheight;

			// draw chained images in sequence
			var imageTemp = image;
			var tmpFillStyle;
			while (imageTemp.m_Prev != null) {
				imageTemp = imageTemp.m_Prev;
			}
			while (imageTemp != null && imageTemp.complete == true) {
				// optional draw the image background into the canvas
				if (imageTemp.m_FillStyle != null) {
					if (VBI.m_bTrace) {
						VBI.Trace("RenderTile fillRect " + imageTemp.src);
					}
					tmpFillStyle = context.fillStyle;
					context.fillStyle = imageTemp.m_FillStyle;
					context.fillRect(left, top, picWidth, picHeight);
					context.fillStyle = tmpFillStyle;
				}
				// as soon as an image is rendererd set the parent of the next to null
				if (VBI.m_bTrace) {
					VBI.Trace("RenderTile drawImage " + imageTemp.src);
				}
				context.globalAlpha = imageTemp.m_Opacity;

				context.drawImage(imageTemp, left, top, picWidth, picHeight);
				imageTemp.bRendered = true;

				if (imageTemp.m_Next != null) {
					imageTemp.m_Next.m_Prev = null;
				}
				imageTemp = imageTemp.m_Next;
			}

			// draw debug information on tile
			if (VBI.m_bTrace) {
				tmpFillStyle = context.fillStyle;
				context.fillStyle = "#FF0000";
				context.font = "18px Arial";
				context.fillText(image.m_nRequest + "." + image.m_nCount + ":" + image.m_nLOD + "/" + image.m_nReqX + "/" + image.m_nReqY + "@(" + (left / 256) + "," + (top / 256) + ")", left + 10, top + 30);
				context.fillStyle = tmpFillStyle;
			}
			// size it up again
			targetCanvas.setPixelWidth(canvasWidth);
			targetCanvas.setPixelHeight(canvasHeight);

			// raise the changed event
			if (targetCanvas.onTileLoaded) {
				targetCanvas.onTileLoaded(image);
			}
			context.globalAlpha = 1.0;

			mapmanager.CheckTmpCanvas(targetCanvas, image.m_nRequest, 0);
			if (currentScene.m_Ctx.moThumbnail) {
				currentScene.Copy2Thumbnail();
			}
		}
	};

	mapmanager.CheckTmpCanvas = function(targetCanvas, imgRequest, nTilesAbove) {

		if ((targetCanvas.m_nTilesBefSwitch != undefined) && (targetCanvas.m_nRequest == imgRequest) && !nTilesAbove) {
			targetCanvas.m_nTilesBefSwitch--;
			if (!targetCanvas.m_nTilesBefSwitch) {
				targetCanvas.m_Scene.SwitchTmpCanvasToActive();
			}
		}

	};
	// request the tiles
	mapmanager.RequestTiles = function(targetCanvas, maplayerstack, x, y, nx, ny, leftOffset, topOffset, rightOffset, bottomOffset, lod, bclear) {
		mapmanager.m_bRequestError = false;
		if (lod < 0) {
			return false;
		}
		var sc = targetCanvas.m_Scene;

		if (!maplayerstack || ((sc.AnimZoomTarget) && (Math.abs(sc.AnimZoomTarget - lod) > sc.m_nMaxAnimLodDiff))) { // - With an existing
			// animation target which is
			// too far away we skip
			// loading as otherwise
			// we would have to wait for all intermediate tiles after reaching target
			// - Without maplayerstack requesting is also not done
			targetCanvas.m_nCurrentX = x;
			targetCanvas.m_nCurrentY = y;
			targetCanvas.m_nCurrentLOD = lod;
			return false;
		}

		var nCount = 0;
		var nYMax = (1 << lod);
		var xyRatio = sc.m_Proj.m_nXYRatio;
		var nXMax = nYMax * xyRatio;

		var fTileSize = 2.0 / nYMax;

		if (bclear) {
			var context = targetCanvas.getContext("2d");
			context.fillStyle = 'white';
			context.clearRect(0, 0, context.canvas.width, context.canvas.height);
		}

		var maplayerarray = maplayerstack.m_MapLayerArray;

		targetCanvas.m_nRequest = mapmanager.m_nRequest++;
		targetCanvas.m_bInvalid = false; // the request makes it valid

		// store current requested tile information in the canvas
		targetCanvas.m_nCurrentX = x;
		targetCanvas.m_nCurrentY = y;
		targetCanvas.m_nCurrentLOD = lod;

		var ni, nk, nYExpansion, nCurrentXExpansion = 1;
		var yCorr = y;

		if (maplayerstack.m_bSingleBMP) {
			nk = 1;
			yCorr = Math.max(0, y);
			nYExpansion = Math.min(ny - topOffset - bottomOffset, nYMax - yCorr);
		} else {
			nk = ny - topOffset - bottomOffset;
			nYExpansion = 1;
		}

		var nLayerArrayLen = maplayerarray.length;
		ni = nx - leftOffset - rightOffset; // on LOD 0 and 1 there are less tiles
		for (var i = 0; i < ni; ++i) {
			nCurrentXExpansion--;
			if (!nCurrentXExpansion) { // we are no more part of an expanded tile
				for (var k = 0; k < nk; ++k) {
					nCount++;
					var imagePrev = null;
					var fillStyle = null;
					var nReqX = (x + leftOffset + i) % nXMax;
					if (nReqX < 0) {
						nReqX = nXMax + nReqX;
					}
					var nReqY = yCorr + topOffset + k;
					if ((nReqY + nYExpansion) <= 0 || nReqY >= nYMax) {
						if ((targetCanvas.m_nTilesBefSwitch != undefined) && (targetCanvas.m_nTilesBefSwitch > 0)) {
							targetCanvas.m_nTilesBefSwitch--;
						}
						continue;
					}
					nCurrentXExpansion = maplayerstack.m_bSingleBMP ? Math.min(nXMax - nReqX, ni - i) : 1;

					// iterate over all map providers
					for (var s = 0; s < nLayerArrayLen; ++s) {
						var maplayer = maplayerarray[s];

						// remember the maplayer fill style
						// to inherit the style when image chain gets shortened due to LOD limits
						if (maplayerstack.fillStyle) {
							fillStyle = maplayerstack.fillStyle;
						} else if (maplayerstack.m_colBkgnd) {
							fillStyle = maplayerstack.m_colBkgnd;
						}
						// create the chained list only in the vaild LOD range
						if ((maplayer.GetMinLOD() > lod) || (maplayer.GetMaxLOD() < lod)) {
							continue;
						}
						var image = new Image();

						// enhance image object
						image.m_nLayersAbove = nLayerArrayLen - s - 1;
						image.m_nXOrigin = x;
						image.m_nYOrigin = y;
						image.m_nCol = i + leftOffset; // remember column
						image.m_nRow = k + topOffset; // remember row
						image.m_numCol = nx; // remember column count
						image.m_numRow = ny; // remember row count
						image.m_Target = targetCanvas; // canvas to render into
						image.m_nRequest = targetCanvas.m_nRequest;
						// image.m_MapProvider = maplayer.GetMapProvider();
						image.m_Opacity = maplayer.m_fOpacity;
						image.m_bOutdated = false;

						// do image linkage
						// this leads to a uplink and downlink chain
						image.m_Prev = imagePrev;
						if (imagePrev != null) {
							imagePrev.m_Next = image;
						}
						// set the inherited fill style only when image is the chain root
						if (image.m_Prev == null) {
							image.m_FillStyle = fillStyle;
						}

						image.m_nReqX = nReqX;
						image.m_nReqY = nReqY;
						image.m_nXExpansion = nCurrentXExpansion;
						image.m_nYExpansion = nYExpansion;
						image.m_nLOD = lod;

						var mapProv = maplayer.GetMapProvider();
						var url;

						if (mapProv.m_bPosRequired) {
							var leftupper = [
								nReqX * fTileSize / xyRatio - 1, nReqY * fTileSize - 1
							];
							var rightlower = [
								(nReqX + nCurrentXExpansion) * fTileSize / xyRatio - 1, (nReqY + nYExpansion) * fTileSize - 1
							];
							// VBI.Trace("Requesting "+nReqX+","+nReqY+" with Extension "+nCurrentXExpansion+". Coordinates :
							// "+leftupper[0]+"-->"+rightlower[0]+","+rightlower[1]);
							url = mapProv.CombineUrlWPos(nReqX, nReqY, lod, fTileSize, leftupper, rightlower, nCurrentXExpansion, nYExpansion, mapmanager.m_requestTileWidth, mapmanager.m_requestTileHeight);
						} else {
							url = mapProv.CombineUrl(nReqX, nReqY, lod);
						}
						image.onload = mapmanager.onLoad;
						image.onerror = mapmanager.onError;
						image.onabort = mapmanager.onAbort;

						if ((mapmanager.m_runningRequests < mapmanager.m_limitRequests) && (!mapmanager.m_bRequestError)) {
							mapmanager.m_runningRequests++;
							try {
								image.src = url;
							} catch (e) {
								image.src2execute = url;
								mapmanager.m_requestQueue.push(image);
								mapmanager.onFailedSend(image);
							}
						} else {
							image.src2execute = url;
							mapmanager.m_requestQueue.push(image);
						}
						image.m_nCount = nCount;

						if (VBI.m_bTrace) {
							VBI.Trace("RequestTiles " + url);
						}
						// remember previous image
						imagePrev = image;
						// VBI.Trace("Requesting from origin ("+x+","+y+") m_col/row:("+lod+"/"+image.m_nCol+","+image.m_nRow+")
						// m_NumCol/Row:"+image.m_numCol+","+image.m_numRow+")\n");
					}
				}
			}
		}
		return true;
	};

	mapmanager.UnlinkImage = function(img) {
		var item;
		for (item = img.m_Prev; item; item = item.m_Prev) {
			item.m_bOutdated = true;
		}

		for (item = img.m_Next; item; item = item.m_Next) {
			item.m_bOutdated = true;
		}

		var curPrev = img.m_Prev;
		var curNext = img.m_Next;

		if (curPrev != null) {
			img.m_Prev.m_Next = curNext;
			img.m_Prev = null;
		}
		if (curNext != null) {
			img.m_Next.m_Prev = curPrev;
			img.m_Next = null;
		}
	};

	mapmanager.GetPreviewImage = function(lon, lat, lod, maplayerstack, scene, callback) {
		//extend layer configuration object with preview location object which is {lat, lon, lod}
		if (!callback || !maplayerstack  || !lon || !lod || !lat || !scene ) { //check that parameters are valid
			return;
		}

		var exactLod = Math.min(Math.max(lod, scene.GetMinLOD()), scene.GetMaxLOD()); // clamp [min lod...max lod]
		lod = Math.floor(exactLod); //avoid fractional lod

		var tileWidth = scene.m_MapManager.m_tileWidth; //get proper tile width
		var tileHeight = scene.m_MapManager.m_tileHeight; //get proper tile height
		var xyRatio = scene.m_Proj.m_nXYRatio; //ratio from  current projection
		var lodDistance = (1 << lod); //how many tiles on a particular lod?
		var tileSize = 2.0 / lodDistance; //???
		var lonlat = VBI.MathLib.DegToRad([parseFloat(lon),parseFloat(lat)]); //from degrees to radians
		var uxy = [lodDistance * tileWidth, lodDistance * tileHeight]; //prepare conversion from lat,lon
		scene.m_Proj.LonLatToUCS(lonlat, uxy); // to User Coordinate System (pixel space of a target lod)
		var x = Math.floor(uxy[0] / tileWidth); // calculate X tile coordinate
		var y = Math.floor(uxy[1] / tileHeight); //calculate Y tile coordinate

		var mapLayerArray = maplayerstack.m_MapLayerArray;

		var context = {
			m_Callback: callback,
			m_Images: [],
			m_ImagesRemain: mapLayerArray.length,
			m_MapLayerStack: maplayerstack,

			compose: function() {
				this.m_ImagesRemain -= 1;

				if (this.m_ImagesRemain <= 0) { //all images processes (succeeded, failed or aborted)
					//create canvas to store image
					var canvas = document.createElement('canvas');
					context = canvas.getContext('2d');

					var background = this.m_MapLayerStack.m_colBkgnd;
					context.fillStyle = background; //respect background colour
					context.fillRect(0, 0, canvas.width, canvas.height);

					for (var i = 0; i < this.m_Images.length; ++i) {
						if (this.m_Images[i]) { //skip failed images

							// respect transparency
							context.globalAlpha = this.m_Images[i].m_Opacity;

							// X and Y Starting positions of the clipping
							var clipPosX = 0;
							var clipPosY = 0;

							// Portion of image you want to clip.
							var clipWidth = this.m_Images[i].width;
							var clipHeight = this.m_Images[i].height;

							//	Draw image onto canvas
							var offsetX = 0;
							var offsetY = 0;

							// Scale to stretch
							var stretchX = canvas.width;
							var stretchY = canvas.height;

							// Draw image based on measurments
							context.drawImage(this.m_Images[i],clipPosX,clipPosY,clipWidth,clipHeight, offsetX,offsetY, stretchX, stretchY); //draw image to canvas
						}
					}
					var tileImages = new Image();
					// convert into image
					tileImages.src = canvas.toDataURL();
					callback(tileImages);
				}
			}
		};

		var onImageLoad = function(event) {
			if (VBI.m_bTrace) {
				VBI.Trace("onLoad " + event.target.src);
			}
			var image = event.target;
			image.m_Context.compose();
		};

		var onImageAbort = function(event) {
			if (VBI.m_bTrace) {
				VBI.Trace("onAbort " + event.target.src);
			}
			var image = event.target;
			image.m_Context.m_Images[image.m_Index] = null;
			image.m_Context.compose();
		};

		var onImageError = function(event) {
			if (VBI.m_bTrace) {
				VBI.Trace("onError " + event.target.src);
			}
			var image = event.target;
			image.m_Context.m_Images[image.m_Index] = null;
			image.m_Context.compose();
		};

		for (var i = 0; i < mapLayerArray.length; ++i) {
			var layer = mapLayerArray[i];
			var provider = layer.GetMapProvider();

			if (layer.GetMinLOD() > lod || layer.GetMaxLOD() < lod) { //skip if provider doesn't support required lod
				continue;
			}
			var url;

			if (provider.m_bPosRequired) {
				var leftUpper = [x * tileSize / xyRatio - 1, y * tileSize - 1];
				var rightLower = [(x + 1) * tileSize / xyRatio - 1, (y + 1) * tileSize - 1];
				url = provider.CombineUrlWPos(x, y, lod, tileSize, leftUpper, rightLower, 1, 1, tileWidth, tileHeight);
			} else {
				url = provider.CombineUrl(x, y, lod);
			}
			var image = new Image();
			image.setAttribute('crossOrigin', 'anonymous');
			context.m_Images[i] = image;
			image.m_Index = i;
			image.m_Context = context;

			if (layer.m_fOpacity) {
				image.m_Opacity = layer.m_fOpacity;
			}
			image.onload = onImageLoad;
			image.onabort = onImageAbort;
			image.onerror = onImageError;

			try {
				image.src = url;
			} catch (ex) {
				if (VBI.m_bTrace) {
					VBI.Trace("GetPreviewImage " + ex);
				}
				image.m_Context.m_Images[image.m_Index] = null;
				image.m_Context.compose();
			}
		}
	};
	return mapmanager;
})();
