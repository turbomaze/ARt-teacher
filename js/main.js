class BobRossAr {
  static init() {
    const bobRossAr = new BobRossAr(
      1280, 720,
      15,
      document.getElementById("camera"),
      document.getElementById("render")
    );
    document.getElementById("render").style.display = "none";

    // document.body.addEventListener("click", () => {
    bobRossAr.start();
    // });
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
}

window.addEventListener('DOMContentLoaded', BobRossAr.init);
