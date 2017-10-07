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
      // mobile later:
      //   facingMode: {
      //     exact: "environment"
      //   }
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

    // horizontal edges
    const edges = this.renderCtx.createImageData(this.width, this.height);
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
        const color = (xdiff > 10 || ydiff > 10) ? 255 : 0;
        edges.data[i + 0] = color;
        edges.data[i + 1] = color;
        edges.data[i + 2] = color;
        edges.data[i + 3] = 255;
      }
    }
    this.renderCtx.putImageData(edges, 0, 0);
  }
}

window.addEventListener('DOMContentLoaded', BobRossAr.init);
