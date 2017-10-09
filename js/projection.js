class BobRossArProjection {
  constructor(width, height, scale) {
    this.WIDTH = width;
    this.HEIGHT = height;
    this.NAME = 'MINION-transparent_STEP';
    this.scale = scale;

    this.scene = new THREE.Scene();
    const light = new THREE.AmbientLight(0xffffff); // hard white light
    this.scene.add(light);

    this.camera = new THREE.PerspectiveCamera(31, this.WIDTH/this.HEIGHT, 1, 1000);

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
    this.marker = new THREE.Object3D();
    this.marker.add(markerMesh);
    this.scene.add(this.marker);

    // config the renderer
    this.renderer = new THREE.WebGLRenderer({ alpha: true });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setSize(this.WIDTH, this.HEIGHT);
    this.renderer.domElement.id = 'projected-image';
  }

  render(pose, idx) {
    if (this.index !== idx) {
      this.index = idx;
      this.mesh.material.map = this.textures[this.index];
      this.mesh.material.needsUpdate = true;
    }

    // update the marker mesh
    this.marker.scale.x = this.scale; // mm on each side
    this.marker.scale.y = this.scale;
    this.marker.scale.z = this.scale;

    this.marker.rotation.x = -Math.asin(-pose.bestRotation[1][2]);
    this.marker.rotation.y = -Math.atan2(pose.bestRotation[0][2], pose.bestRotation[2][2]);
    this.marker.rotation.z = Math.atan2(pose.bestRotation[1][0], pose.bestRotation[1][1]);

    this.marker.position.x = pose.bestTranslation[0];
    this.marker.position.y = pose.bestTranslation[1];
    this.marker.position.z = -pose.bestTranslation[2];

    this.renderer.render(this.scene, this.camera);
  }
}
