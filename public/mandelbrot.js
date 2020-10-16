var fractal;
onmessage = async m => {
	m = m.data;
	let data = m.data;
	switch (m.name) {
		case "create":
			fractal = new Mandelbrot(data.w, data.h);
		break;
		case "getCanvas":
			sendCanvas();
		break;
		case "resize":
			fractal.resize(data.w, data.h);
			sendCanvas();
		break;
		case "zoom":
			fractal.zoom(data.x, data.y, data.m);
			sendCanvas();
		default:
			return;
	}
}
function post(n, d) {
	postMessage({name: n, data: d});
}
async function sendCanvas() {
	post("canvasData", (await fractal.drawToCanvas()).transferToImageBitmap());
}
class Mandelbrot {
	static ESCAPE_RAD = 2;
	static MAX_ITER = 2000;
	constructor(w, h) {
		this.canvas = new OffscreenCanvas(w, h);
		this.ctx = this.canvas.getContext("2d");
		this.win = {
			w: w,
			h: h,
			scale: 3
		};
		this.focus = {
			x: -3,
			y: -1.5
		};
	}
	async drawToCanvas() {
		for (var x = 0; x < this.win.w; x++) {
			for (var y = 0; y < this.win.h; y++) {
				let c = Complex.make.apply(null, this.pixelToCoord(x, y));
				let z = new Complex(0, 0);
				let i;
				for (i = 0; i < Mandelbrot.MAX_ITER; i++) {
					if (z.abs() > Mandelbrot.ESCAPE_RAD) {
						break;
					}
					z = z.square().add(c);
				}
				this.fillPixel(x, y, this.colorFunc1(i, z));
			}
		}
		return this.canvas;
	}
	colorFunc1(i, z) {
		if (i == Mandelbrot.MAX_ITER) return "white";
		let color = Math.log(Math.log(z.abs()) / Math.log(Mandelbrot.ESCAPE_RAD));
		return `hsl(${color * 40 + 200 }, ${color}%, ${Math.cbrt(i / Mandelbrot.MAX_ITER)*100}%)`;
	}
	colorFunc2(i, z) {
		if (i == Mandelbrot.MAX_ITER) return "white";
		let a = ((i / Mandelbrot.MAX_ITER) * 1.9) - 1.55;
		return `hsl(${(i ** (1- i))*360}, 100%, ${Math.cbrt(i / Mandelbrot.MAX_ITER) * 100}%)`;
	}
	fillPixel(x, y, color) {
		this.ctx.save();
		this.ctx.fillStyle = color;
		this.ctx.fillRect(x, y, 1, 1);
		this.ctx.restore();
	}
	zoom(x, y, percent) {
		let point = this.pixelToCoord(x, y);
		post("log",point);
		this.win.scale *= percent;
		this.focus.x = point[0] - (this.win.scale / 2) * (this.win.w / this.win.h);
		this.focus.y = point[1] - (this.win.scale / 2);
	}
	pixelToCoord(xstep, ystep) {
		return [
			(this.focus.x + ((this.win.scale / this.win.h) * xstep)),
			(this.focus.y + ((this.win.scale / this.win.h) * ystep))
		];
	}
	resize(w, h) {
		this.scale *= w / this.win.w;
		this.win.w = w;
		this.win.h = h;
		this.canvas = new OffscreenCanvas(w, h);
		this.ctx = this.canvas.getContext("2d");
	}
}
class Complex {
	constructor(real, imaginary) {
		this.real = real;
		this.imag = imaginary;
	}
	static make(real, imag) {
		return new Complex(real, imag);
	}
	conj(num) {
		return new Complex(num.real, -num.imag);
	}
	add(num) {
		return new Complex(this.real + num.real, this.imag + num.imag);
	}
	subtract(num) {
		return new Complex(this.real - num.real, this.imag - num.imag);
	}
	divide(num) {
		let numerator = this.multiply(num.conj());
		let denominator = num.multiply(num.conj());
		return new Complex(numerator.real / denominator.real, numerator.imag / denominator.imag);
	}
	multiply(num) {
		return new Complex((this.real * num.real) - (this.imag * num.imag), (this.imag * num.real) + (this.real * num.imag));
	}
	abs() {
		return Math.sqrt((this.real ** 2) + (this.imag ** 2))
	}
	square() {
		return new Complex((this.real ** 2) - (this.imag ** 2), 2 * (this.imag * this.real));
	}
	toString() {
		return `${this.real}${this.imaginary}i`;
	}
}
//https://randomascii.wordpress.com/2011/08/13/faster-fractals-through-algebra/