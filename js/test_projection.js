const WIDTH = 732;
const HEIGHT = 411;

class BobRossArProjection {
  constructor() {
    this.scene = new THREE.Scene();
    const light = new THREE.AmbientLight(0xffffff); // hard white light
    this.scene.add( light );

    this.camera = new THREE.PerspectiveCamera(
      60, WIDTH/HEIGHT, 1, 1000
    );
    this.camera.position.set(0, 6, 0.1);
    this.camera.up = new THREE.Vector3(0, 1, 0);
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));

    const geometry = new THREE.CubeGeometry(1, 0.01, 1);
    const texture = THREE.ImageUtils.loadTexture('images/MINION-pink.png');
    const material = new THREE.MeshPhongMaterial({map: texture});
    material.transparent = true;
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(0.5, 0, -0.5);
    this.scene.add(this.mesh);

    this.renderer = new THREE.WebGLRenderer({ alpha: true });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setSize(WIDTH, HEIGHT);
    this.renderer.domElement.id = 'projected-image';
  }

  render(corners) {
    function getArea(cs) {
      return Math.abs(
        (cs[0].x * cs[1].y - cs[0].y * cs[1].x) +
        (cs[1].x * cs[2].y - cs[1].y * cs[2].x) +
        (cs[2].x * cs[3].y - cs[2].y * cs[3].x) +
        (cs[3].x * cs[0].y - cs[3].y * cs[0].x)
      ) / 2;
    }

    const k1 = -1 / 65; // horizontal constant
    const k2 = 14.0; // size constant
    const k3 = -1 / 65; // vertical constant
    const camX = k1 * (corners[0].x - (WIDTH/2));
    const camY = k2 - Math.pow(getArea(corners), 0.25);
    const camZ = k3 * (corners[0].y - (HEIGHT/2));
    this.camera.position.x = camX;
    this.camera.position.y = camY;
    this.camera.position.z = camZ;
    this.renderer.render(this.scene, this.camera);
  }
}
