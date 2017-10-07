class BobRossAr {
  static init() {
    const bobRossAr = new BobRossAr(
      640, 360,
      15,
      document.getElementById("camera"),
      document.getElementById("render")
    );

    bobRossAr.start();
  }

  static registerVideoHandlers(width, height, streamCb, errCb) {
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
    if (navigator.getUserMedia) {
      if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        navigator.getUserMedia(
          {
            video: {
              width: width,
              height: height,
              facingMode: {
                exact: "environment"
              }
            },
            audio: false
          },
          streamCb,
          errCb
        );
      } else {
        navigator.getUserMedia(
          {
            video: {
              width: width,
              height: height
            },
            audio: false
          },
          streamCb,
          errCb
        );
      }
    } else {
      errorCallback({
        message: "Unforunately your browser doesn't support getUserMedia. Try chrome."
      });
    }
  }

  constructor(width, height, fps, video, renderCanvas) {
    this.video = video;
    this.renderCanvas = renderCanvas;
    this.renderCtx = this.renderCanvas.getContext("2d");
    this.isStreaming = false;
    this.width = width;
    this.height = height;
    this.fps = fps;
    this.time = 0;
    this.frames = 0;
    this.TEMPLATE = [
      -4, -4, -3, -2, -2, +1, +1, +1, +1, +1, -2, -2, -3, -4, -4,
      -4, -3, -2, +1, +1, +1, +1, +1, +1, +1, +1, +1, -2, -3, -4,
      -3, -2, +1, +1, +1, +1, +1, -2, +1, +1, +1, +1, +1, -2, -3,
      -2, +1, +1, +1, +1, -2, -2, -2, -2, -2, +1, +1, +1, +1, -2,
      -2, +1, +1, +1, -2, -2, -2, -2, -2, -2, -2, +1, +1, +1, -2,
      +1, +1, +1, -2, -2, -2, +1, +1, +1, -2, -2, -2, +1, +1, +1,
      +1, +1, +1, -2, -2, +1, +1, +1, +1, +1, -2, -2, +1, +1, +1,
      +1, +1, -2, -2, -2, +1, +1, +1, +1, +1, -2, -2, -2, +1, +1,
      +1, +1, +1, -2, -2, +1, +1, +1, +1, +1, -2, -2, +1, +1, +1,
      +1, +1, +1, -2, -2, -2, +1, +1, +1, -2, -2, -2, +1, +1, +1,
      -2, +1, +1, +1, -2, -2, -2, -2, -2, -2, -2, +1, +1, +1, -2,
      -2, +1, +1, +1, +1, -2, -2, -2, -2, -2, +1, +1, +1, +1, -2,
      -3, -2, +1, +1, +1, +1, +1, -2, +1, +1, +1, +1, +1, -2, -3,
      -4, -3, -2, +1, +1, +1, +1, +1, +1, +1, +1, +1, -2, -3, -4,
      -4, -4, -3, -2, -2, +1, +1, +1, +1, +1, -2, -2, -3, -4, -4
    ];
  }

  start() {
    const self = this;

    // initialize the canvas for drawing
    this.video.addEventListener(
      "canplay",
      function(e) {
        if (!self.isStreaming) {
          self.renderCanvas.setAttribute("width", self.width);
          self.renderCanvas.setAttribute("height", self.height);
          self.isStreaming = true;
        }
      },
      false
    );

    // set up the drawing loop
    this.video.addEventListener(
      "play",
      function() {
        // Every n milliseconds copy the video image to the canvas
        setInterval(function() {
          if (self.video.paused || self.video.ended) return;
          const start = +new Date();

          self.renderCtx.fillRect(0, 0, self.width, self.height);
          self.renderCtx.drawImage(self.video, 0, 0, self.width, self.height);

          self.process();

          const duration = +new Date() - start;
          self.time += duration;
          self.frames += 1;
        }, 1000 / self.fps);
      },
      false
    );

    // register all the handlers
    BobRossAr.registerVideoHandlers(
      this.width,
      this.height,
      s => {
        self.video.srcObject = s;
        self.video.onloadedmetadata = e => {
          self.video.play();
        };
      },
      err => alert("Oops: " + err.code + ")")
    );
  }

  process() {
    const self = this;
    const data = this.renderCtx.getImageData(0, 0, this.renderCanvas.width, this.renderCanvas.height);

    // luminance
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const i = 4 * (y * this.width + x);
        const lightness = 0.3 * data.data[i + 0] + 0.58 * data.data[i + 1] + 0.11 * data.data[i + 2];
        data.data[i + 0] = Math.floor(lightness);
        data.data[i + 1] = Math.floor(lightness);
        data.data[i + 2] = Math.floor(lightness);
      }
    }

    // edges
    const colorEdges = this.renderCtx.createImageData(this.width, this.height);
    const edges = new Uint8Array(this.width * this.height);
    const thresh = 5;
    for (let y = 1; y < this.height - 1; y++) {
      for (let x = 1; x < this.width - 1; x++) {
        // implied kernel: [-1, 0, 1]
        const i = 4 * (y * this.width + x);
        const it = 4 * ((y - 1) * this.width + x);
        const ir = 4 * (y * this.width + x + 1);
        const ib = 4 * ((y + 1) * this.width + x);
        const il = 4 * (y * this.width + x - 1);
        const xdiff = data.data[ir + 0] - data.data[il + 0];
        const ydiff = data.data[it + 0] - data.data[ib + 0];
        const isEdge = xdiff > thresh || ydiff > thresh;
        const color = isEdge ? 255 : 0;
        edges[i / 4] = +isEdge;
        colorEdges.data[i + 0] = color;
        colorEdges.data[i + 1] = color;
        colorEdges.data[i + 2] = color;
        colorEdges.data[i + 3] = 255;
      }
    }

    // render the edges
    // this.renderCtx.putImageData(colorEdges, 0, 0);

    // template match for circles
    const result = BobRossAr.applyBinaryFilter(
      edges, this.width, this.height, this.TEMPLATE, 15, 15, 30, 0
    );
    this.renderCtx.strokeStyle = 'red';
    for (let i = 0; i < result.length; i++) {
      if (result[i]) {
        const x = i % this.width;
        const y = Math.floor(i / this.width);
        this.renderCtx.strokeRect(x - 7, y - 7, 15, 15);
      }
    }
  }

  // preconditions:
  //   w -- width of the image implied by uint8_arr
  //   h -- height " ... "
  //   kernel -- the kernel to apply
  //   kw -- kernel width; must be odd
  //   kh -- kernel height; must be odd
  //   thresh -- the activation threshold
  // postconditions:
  //   returns Uint8Array of the filter results
  static applyBinaryFilter(uint8_arr, w, h, kernel, kw, kh, thresh) { 
    const kw_off = Math.floor(kw / 2);
    const kh_off = Math.floor(kw / 2);
    const result = new Uint8Array(w * h);
    for (let y = kh_off; y < h - kh_off; y++) {
      for (let x = kw_off; x < w - kw_off; x++) {
        const i = y * w + x;
        let sum = 0;
        // convolve the kernel with the image
        for (let ky = 0; ky < kh; ky++) {
          for (let kx = 0; kx < kw; kx++) {
            const ki = (y + ky - kh_off) * w + (x + kx - kw_off);
            sum += uint8_arr[ki] * kernel[ky * kh + kx];
          }
        }
        result[i] = sum > thresh ? 1 : 0;
      }
    }
    return result;
  }
}

window.addEventListener('DOMContentLoaded', BobRossAr.init);
