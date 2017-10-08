const WIDTH = 732;
const HEIGHT = 411;
const NAME = 'MINION-transparent_STEP';

class BobRossArProjection {
  constructor() {
    this.scene = new THREE.Scene();
    const light = new THREE.AmbientLight(0xffffff); // hard white light
    this.scene.add( light );

    this.camera = new THREE.PerspectiveCamera(
      60, WIDTH/HEIGHT, 1, 1000
    );
    this.camera.position.set(0, 17, 0.1);
    this.camera.up = new THREE.Vector3(0, 1, 0);
    this.camera.lookAt(new THREE.Vector3(0, 0, -4));

    // reference
    const geometry = new THREE.CubeGeometry(4, 0.01, 4);
    this.index = 0;
    this.textures = [];
    for (let i = 0; i < 6; i++) {
      // const texture = THREE.ImageUtils.loadTexture('images/'+NAME+(i + 1)+'.png');
      const texture = THREE.ImageUtils.loadTexture('images/MINION-pink.png');
      this.textures.push(texture);
    }
    this.material = new THREE.MeshPhongMaterial({map: this.textures[this.index]});
    this.material.transparent = true;

    const www = 17;
    const hhh = 12;
    const geometry2 = new THREE.CubeGeometry(www, 0.01, hhh);
    geometry2.translate(www/2, 0, hhh/2);
    this.mesh2 = new THREE.Mesh(geometry2, this.material);
    this.mesh2.position.set(0.5 + 2, 0, -7 + 2);
    this.scene.add(this.mesh2);

    this.renderer = new THREE.WebGLRenderer({ alpha: true });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setSize(WIDTH, HEIGHT);
    this.renderer.domElement.id = 'projected-image';
  }

  render(corners, theta, idx) {
    function getArea(cs) {
      return Math.abs(
        (cs[0].x * cs[1].y - cs[0].y * cs[1].x) +
        (cs[1].x * cs[2].y - cs[1].y * cs[2].x) +
        (cs[2].x * cs[3].y - cs[2].y * cs[3].x) +
        (cs[3].x * cs[0].y - cs[3].y * cs[0].x)
      ) / 2;
    }

    if (this.index !== idx) {
      this.index = idx;
      this.mesh2.material.map = this.textures[this.index];
      this.mesh2.material.needsUpdate = true;
    }

    const k1 = -1 / 25; // horizontal constant
    const k2 = 12.9; // size constant
    const k3 = -1 / 23; // vertical constant
    const camX = k1 * (corners[0].x - (WIDTH/2));
    const area = Math.pow(getArea(corners), 0.25);
    const camY = 63.4 - 7.45 * area + 0.2427 * area * area;
    const camZ = k3 * (corners[0].y - (HEIGHT/2));

    // this.mesh.rotation.y = theta;
    this.mesh2.rotation.y = theta;
    this.camera.position.x = camX;
    this.camera.position.y = camY;
    this.camera.position.z = camZ;
    this.renderer.render(this.scene, this.camera);
  }
}
