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
    this.video = video;
    this.renderCanvas = renderCanvas;
    this.renderCtx = this.renderCanvas.getContext('2d');
    this.isFullScreen = false;
    this.isStreaming = false;
    this.width = width;
    this.height = height;
    this.fps = fps;
    this.time = 0;
    this.frames = 0;

    // objectdetect stuff
    const detectorSize = 120;
    this.smoother = new Smoother(
      [0.8, 0.8, 0.8, 0.8],
      [0, 0, 0, 0]
    );
    this.detector = new objectdetect.detector(
      detectorSize * (this.width / this.height),
      detectorSize,
      1.5,
      objectdetect.frontalface_alt
    );
    this.faces = [];
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
      // find new faces
      const newFaces = this.detector.detect(this.video, 1).map((face) => {
        const widthMultiplier = self.video.videoWidth / self.detector.canvas.width;
        const heightMultiplier = self.video.videoHeight / self.detector.canvas.height;
  	  	// Rescale coordinates from detector to video coordinate space:
        return {
          x: face[0] * widthMultiplier,
          y: face[1] * heightMultiplier,
          width: face[2] * widthMultiplier,
          height: face[3] * heightMultiplier,
          confidence: face[4],
        };
      }).filter(face => {
        return face.confidence > 3;
      });

      // match the new faces to the old faces
      const faceMatchThresh = 80;
      const matchedIds = {};
      let addedNewFace = false;
      const matchedFaces = newFaces.map(face => {
        const closestFace = self.getClosestExistingFace(face);
        if (closestFace.distance < faceMatchThresh) {
          face.id = closestFace.id;
          face.blocked = closestFace.blocked;
          matchedIds[face.id] = true;
        } else {
          face.id = Math.random().toString();
          addedNewFace = true;
        }
        return face;
      });

      // collect all the faces into an organized updated set
      const allFaces = matchedFaces;
      const maxStale = 4;
      this.faces.forEach(face => {
        if (!(face.id in matchedIds)) {
          if (face.hasOwnProperty('staleness')) {
            if (face.staleness > maxStale) {
              // don't add it
            } else {
              // add it with increased staleness
              face.staleness += 1;
              allFaces.push(face);
            }
          } else {
            face.staleness = 1;
            allFaces.push(face);
          }
        }
      });

      this.faces = allFaces;
    }

    if (this.faces.length >= 3) {
      console.log(this.faces.map(a => {
        return {x: a.x, y: a.y};
      }));
      // identify the faces
      const rightFace = this.faces.sort((a, b) => {
        return b.x - a.x;
      })[0];
      const botFace = this.faces.filter(a => {
        return a.id !== rightFace.id;
      }).sort((a, b) => {
        return a.y - b.y;
      })[1];
      const topFace = this.faces.filter(a => {
        return a.id !== rightFace.id && a.id !== botFace.id;
      }).sort((a, b) => {
        return (a.x + a.y) - (b.x + b.y);
      })[0];
      const lastFace = {x: rightFace.x, y: botFace.y};
      const xOff = (rightFace.x - topFace.x) * 2 / 5 + topFace.x;
      const yOff = (botFace.y - topFace.y) * 2 / 3.9 + topFace.y;
      const paperW = (rightFace.x - topFace.x) * 7.2 / 5;
      const paperH = (botFace.y - topFace.y) * 4.7 / 3.9;
      this.renderCtx.fillStyle = 'red';
      this.renderCtx.beginPath();
      this.renderCtx.moveTo(xOff, yOff);
      this.renderCtx.lineTo(xOff + paperW, yOff);
      this.renderCtx.lineTo(xOff + paperW, yOff + paperH);
      this.renderCtx.lineTo(xOff, yOff + paperH);
      this.renderCtx.closePath();
      this.renderCtx.fill();
    }

    // box the faces
    this.renderCtx.strokeStyle = 'red';
    for (let i = 0; i < this.faces.length; i++) {
      const face = this.faces[i];
      this.renderCtx.strokeRect(face.x, face.y, face.width, face.height);
    }
  }

  getClosestExistingFace(face) {
    let bestDist = Infinity;
    let bestId = false;
    let bestBlocked = false;
    this.faces.forEach(existingFace => {
      const dist = Math.sqrt(
        Math.pow(
          (existingFace.x + existingFace.width/2) -
          (face.x + face.width/2), 2
        ) +
        Math.pow(
          (existingFace.y + existingFace.height/2) -
          (face.y + face.height/2), 2
        )
      );
      if (dist < bestDist) {
        bestDist = dist;
        bestId = existingFace.id;
      }
    });
    return { id: bestId, distance: bestDist };
  }
}

window.addEventListener('DOMContentLoaded', BobRossAr.init);
