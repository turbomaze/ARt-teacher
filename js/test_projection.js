class BobRossArProjection {
  constructor() {
    this.scene = new THREE.Scene();
    const light1 = new THREE.DirectionalLight( 0xdddddd );
    light1.position.set( 0, 1, 1 ).normalize();
    this.scene.add(light1);
    const light2 = new THREE.DirectionalLight( 0xdddddd );
    light2.position.set( 0, -1, 1 ).normalize();
    this.scene.add(light2);

    this.camera = new THREE.PerspectiveCamera(
      70, window.innerWidth / window.innerHeight, 1, 1000
    );

    const geometry = new THREE.CubeGeometry(7.2, 4.7, 0.1);
    const material = new THREE.MeshPhongMaterial({
      map: THREE.ImageUtils.loadTexture('images/MINION-transparent.png')
    });
    material.transparent = true;
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.z = -5;
    this.mesh.rotation.x = (Math.PI / 180) * 0.0;
    this.mesh.rotation.y = (Math.PI / 180) * 0.0;
    this.mesh.rotation.z = (Math.PI / 180) * 0.0;
    this.scene.add(this.mesh);

    this.renderer = new THREE.WebGLRenderer({ alpha: !true });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setSize(732, 411);
    this.renderer.domElement.id = 'projected-image';
    document.body.appendChild(this.renderer.domElement);
  }

  render(theta, phi) {
    this.mesh.rotation.z = theta;
    this.mesh.rotation.x = phi;
    this.renderer.render(this.scene, this.camera);
  }
}
