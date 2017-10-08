class BobRossAr {
  static init() {
    const bobRossAr = new BobRossAr(
      732, 411,
      15,
      document.getElementById('camera'),
      document.getElementById('render')
    );
    document.getElementById('render').style.display = 'none';

    document.body.addEventListener('click', function(e) {
      if (!bobRossAr.isFullScreen) {
        if (document.location.hash !== '#desktop') {
          BobRossAr.forceFullScreen();
        }
        bobRossAr.isFullScreen = true;

        document.getElementById('fullscreen-message').className = 'clicked';
        bobRossAr.start();
        document.getElementById('render').style.display = 'block';
        document.getElementById('fullscreen-message').style.display = 'none';
      }
      e.preventDefault();
    });

    if (!document.location.hash.startsWith('#desktop')) {
      try {
        screen.orientation.lock('landscape');
      } catch (e) {
        console.log('Encountered screen orientation lock error.');
        console.log(e);
      }
    }
  }

  static registerVideoHandlers(width, height, streamCb, errCb) {
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
    if (navigator.getUserMedia) {
      if (location.hash !== '#desktop') {
        navigator.getUserMedia(
          {
            video: {
              width: width,
              height: height,
              facingMode: { exact: 'environment' }
            },
            audio: false
          }, streamCb, errCb
        );
      } else {
        navigator.getUserMedia(
          {
            video: { width: width, height: height },
            audio: false
          }, streamCb, errCb
        );
      }
    } else {
      errorCallback({
        message: 'Unforunately your browser doesn\'t support getUserMedia. Try chrome.'
      });
    }
  }

  static forceFullScreen() {
    const doc = window.document;
    const docEl = doc.documentElement;
    const requestFullScreen =
      docEl.requestFullscreen ||
      docEl.mozRequestFullScreen ||
      docEl.webkitRequestFullScreen ||
      docEl.msRequestFullscreen;
    if (
      !doc.fullscreenElement &&
      !doc.mozFullScreenElement &&
      !doc.webkitFullscreenElement &&
      !doc.msFullscreenElement
    ) {
      requestFullScreen.call(docEl);
    }
  }

  constructor(width, height, fps, video, renderCanvas) {
    this.projector = new BobRossArProjection();

    this.aruco = new AR.Detector();
    this.posit = new POS.Posit(41, this.width); // 41mm markers
    this.markers = [];

    this.video = video;
    this.renderCanvas = renderCanvas;
    this.renderCtx = this.renderCanvas.getContext('2d');
    document.body.appendChild(this.projector.renderer.domElement);
    this.projectedCanvas = this.projector.renderer.domElement;
    this.isFullScreen = false;
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
      'canplay',
      function(e) {
        if (!self.isStreaming) {
          self.renderCanvas.setAttribute('width', self.width);
          self.renderCanvas.setAttribute('height', self.height);
          self.isStreaming = true;
        }
      },
      false
    );

    // set up the drawing loop
    this.video.addEventListener(
      'play',
      function() {
        // Every n milliseconds copy the video image to the canvas
        setInterval(function() {
          if (self.video.paused || self.video.ended) return;
          const start = +new Date();

          self.renderCtx.fillRect(0, 0, self.width, self.height);
          self.renderCtx.drawImage(self.video, 0, 0, self.width, self.height);

          self.process();

          const duration = +new Date() - start;
          const fontSize = 32;
          self.renderCtx.font = fontSize + 'px Arial';
          self.renderCtx.fillStyle = 'black';
          self.renderCtx.fillText(duration + 'ms', 10, fontSize);
          self.time += duration;
          self.frames += 1;
          if (self.frames % (5 * self.fps) === 0) {
            console.log(
              "Average of " + self.time / self.frames + "ms per frame"
            );
          }
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
      err => alert('Oops: ' + err.code + ')')
    );
  }

  process() {
    const self = this;

    const computeEveryNFrames = 1;
    if (this.frames % computeEveryNFrames === 0) {
      // detect new markers
      const newMarkers = this.aruco.detect(
        this.renderCtx.getImageData(0, 0, this.width, this.height)
      );

      // match the new markers to the old markers
      const matchThresh = 30;
      const matchedIds = {};
      const matchedMarkers = newMarkers.map(marker => {
        const closestMarker = self.getClosestExistingMarker(marker);
        if (closestMarker.distance < matchThresh) {
          marker.id = closestMarker.id;
          matchedIds[marker.id] = true;
        } else {
          marker.id = Math.random().toString();
        }
        return marker;
      });

      // collect all the markers into an organized updated set
      const allMarkers = matchedMarkers;
      const maxStale = 4;
      this.markers.forEach(marker => {
        if (!(marker.id in matchedIds)) {
          if (marker.hasOwnProperty('staleness')) {
            if (marker.staleness > maxStale) {
              // don't add it
            } else {
              // add it with increased staleness
              marker.staleness += 1;
              allMarkers.push(marker);
            }
          } else {
            marker.staleness = 1;
            allMarkers.push(marker);
          }
        }
      });

      this.markers = allMarkers;
    }

    // detect the markers
    this.markers.map(marker => {
      const corners = marker.corners;
      this.renderCtx.fillStyle = 'red';
      this.renderCtx.beginPath();
      this.renderCtx.moveTo(corners[0].x, corners[0].y);
      this.renderCtx.lineTo(corners[1].x, corners[1].y);
      this.renderCtx.lineTo(corners[2].x, corners[2].y);
      this.renderCtx.lineTo(corners[3].x, corners[3].y);
      this.renderCtx.closePath();
      this.renderCtx.fill();
      return marker;
    });

    // render the sketch
    if (this.markers.length > 0) {
      // compute the rotation
      const pose = this.posit.pose(this.markers[0].corners.map(c => {
        const cornerCopy = JSON.parse(JSON.stringify(c));
        cornerCopy.x = cornerCopy.x - (self.width / 2);
        cornerCopy.y = cornerCopy.y - (self.height / 2);
        return cornerCopy;
      }));
      const corners = this.markers[0].corners;
      const theta = Math.atan(
        (corners[0].x - corners[1].x) / (corners[0].y - corners[1].y)
      );
      const negativePhi = BobRossAr.getDist(corners[0], corners[3]) >
        BobRossAr.getDist(corners[1], corners[2]);
      const phi = (negativePhi ? -0.25 : 0.25) * Math.acos(
        BobRossAr.getDist(
          corners[2], corners[3]
        ) / (BobRossAr.getDist(
          corners[0], corners[3]
        ) + 0.00001)
      ) || 0;

      // render the rotated artwork onto the projector's canvas
      this.projector.render(theta, -phi);

      // draw the projected image on the canvas
      const xOff = corners[1].x;
      const yOff = corners[1].y;
      const paperW = 400;
      const paperH = 300;
      this.renderCtx.drawImage(
        this.projectedCanvas, xOff, yOff,
        paperW, paperH
      );
    }
  }

  static getDist(a, b) {
    return Math.sqrt(
      Math.pow(a.x - b.x, 2) +
      Math.pow(a.y - b.y, 2)
    );
  }

  getClosestExistingMarker(marker) {
    let bestDist = Infinity;
    let bestId = false;
    let bestBlocked = false;
    this.markers.forEach(existingMarker => {
      const dist = Math.sqrt(
        Math.pow(existingMarker.corners[0].x - marker.corners[0].x, 2) +
        Math.pow(existingMarker.corners[0].y - marker.corners[0].y, 2)
      );
      if (dist < bestDist) {
        bestDist = dist;
        bestId = existingMarker.id;
      }
    });
    return { id: bestId, distance: bestDist };
  }
}

window.addEventListener('DOMContentLoaded', BobRossAr.init);
