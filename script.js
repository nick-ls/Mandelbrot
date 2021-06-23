const canvas = document.getElementById("plane");
const ctx = canvas.getContext("2d");
const fractal = new Worker("mandelbrot.js");
const ZOOM_SPEED = 0.05;
var canvasCache;
var multiplier = 1;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let resizeTimeout;
window.onresize = e => {
	clearTimeout(resizeTimeout);
	resizeTimeout = setTimeout(function() {
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		fractal.post("resize", {w: window.innerWidth, h: window.innerHeight});
	}, 1000);
}
let zoomTimeout;
document.addEventListener("wheel", e => {
	clearTimeout(zoomTimeout);
	drawPreliminaryZoom(e.x, e.y, multiplier);
	if (e.deltaY > 0) {
		multiplier *= 1 + ZOOM_SPEED;
	} else {
		multiplier *= 1 - ZOOM_SPEED;
	}
	zoomTimeout = setTimeout(function (x, y) {
		fractal.post("zoom", {
			x: x,
			y: y,
			m: multiplier
		});
		multiplier = 1
	}, 1000, e.x, e.y);
});

document.addEventListener("click", e => {
	drawPreliminaryZoom(e.x, e.y, multiplier * 0.5);
	fractal.post("zoom", {
		x: e.x,
		y: e.y,
		m: multiplier
	});
});
document.addEventListener("contextmenu", e => {
	e.preventDefault();
	drawPreliminaryZoom(e.x, e.y, multiplier * 2);
	fractal.post("zoom", {
		x: e.x,
		y: e.y,
		m: multiplier
	});
});
function drawPreliminaryZoom(x, y, zoomLevel) {
	if (canvasCache) {
		multiplier = zoomLevel;
		ctx.save();
		ctx.fillStyle = "black";
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		ctx.drawImage(
			canvasCache,
			-(x / zoomLevel - 0.5 * canvas.width),
			-(y / zoomLevel - 0.5 * canvas.height),
			canvasCache.width / zoomLevel,
			canvasCache.height / zoomLevel
		);
		ctx.restore();
	}
}

fractal.onmessage = m => {
	m = m.data;
	switch(m.name) {
		case "canvasData":
			canvasCache = m.data;
			ctx.drawImage(m.data,0,0);
		break;
		case "log":
			console.log(m);
		break;
		default:
			return;
	}
}
Worker.prototype.post = function (n, d) {
	this.postMessage({
		name: n,
		data: d ? d : ""
	});
}
function init() {
	fractal.post("create", {w: window.innerWidth, h: window.innerHeight});
	fractal.post("getCanvas");
}
init();