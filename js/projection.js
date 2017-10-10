class BobRossArProjection {
  // scale is size of marker in mm
  constructor(width, height, scale) {
    this.WIDTH = width;
    this.HEIGHT = height;
    this.NAME = 'MINION-transparent_STEP';
    this.scale = scale;
    this.buffer = 10; // in mm
    this.paperWidth = 210; // in mm
    this.paperHeight = 148; // in mm

    this.scene = new THREE.Scene();
    const light = new THREE.AmbientLight(0xffffff); // hard white light
    this.scene.add(light);

    const fov = 31;
    this.camera = new THREE.PerspectiveCamera(fov, this.WIDTH/this.HEIGHT, 1, 1000);

    // preload the textures
    this.index = 0;
    this.textures = [];
    for (let i = 1; i <= 6; i++) {
      this.textures.push(
        THREE.ImageUtils.loadTexture('./images/' + this.NAME + i + '.png')
      );
    }
    this.material = new THREE.MeshPhongMaterial({map: this.textures[this.index]});
    this.material.transparent = true;

    // the marker geometry
    const marker = new THREE.PlaneGeometry(1.0, 1.0, 0);
    const markerMesh = new THREE.Mesh(
      marker, 
      new THREE.MeshPhongMaterial({color: '#ff00ff'})
    );
    this.overlay = new THREE.Object3D();
    this.overlay.add(markerMesh);
    this.scene.add(this.overlay);

    // canvas geometry
    const canvWidth = (this.paperWidth - (this.buffer + this.scale))/this.scale;
    const canvHeight = (this.paperHeight - (this.buffer + this.scale))/this.scale;
    const canvas = new THREE.PlaneGeometry(canvWidth, canvHeight, 0);
    const canvasMesh = new THREE.Mesh(canvas, this.material);
    canvasMesh.rotation.z = -Math.PI / 2;
    canvasMesh.position.set(-0.5 - canvHeight/2, -0.5 - canvWidth/2, 0);
    this.overlay.add(canvasMesh);

    // config the renderer
    this.renderer = new THREE.WebGLRenderer({ alpha: true });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setSize(this.WIDTH, this.HEIGHT);
    this.renderer.domElement.id = 'projected-image';
  }

  render(pose, idx) {
    if (this.index !== idx) {
      this.index = idx;
      this.material.map = this.textures[this.index];
      this.material.needsUpdate = true;
    }

    // update the overlay mesh
    this.overlay.scale.x = this.scale; // mm on each side
    this.overlay.scale.y = this.scale;
    this.overlay.scale.z = this.scale;

    this.overlay.rotation.x = -Math.asin(-pose.bestRotation[1][2]);
    this.overlay.rotation.y = -Math.atan2(pose.bestRotation[0][2], pose.bestRotation[2][2]);
    this.overlay.rotation.z = Math.atan2(pose.bestRotation[1][0], pose.bestRotation[1][1]);

    this.overlay.position.x = pose.bestTranslation[0];
    this.overlay.position.y = pose.bestTranslation[1];
    this.overlay.position.z = -pose.bestTranslation[2];

    this.renderer.render(this.scene, this.camera);
  }
}
