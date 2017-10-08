var camera;
var scene;
var renderer;
var mesh;
  
init();
animate();
  
function init() {
  
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      1,
      1000
    );

    var light = new THREE.DirectionalLight( 0xffffff );
    light.position.set( 0, 1, 1 ).normalize();
    scene.add(light);
  
    var geometry = new THREE.CubeGeometry(7.2, 4.7, 0.1);
    var material = new THREE.MeshPhongMaterial( { map: THREE.ImageUtils.loadTexture('images/MINION.png') } );
    material.transparent = true;
 
    mesh = new THREE.Mesh(geometry, material );
    mesh.position.z = -5;
    mesh.rotation.x = (Math.PI / 180) * -20.0 * 0;
    mesh.rotation.y = (Math.PI / 180) * 0.0;
    mesh.rotation.z = (Math.PI / 180) * 0.0;
    scene.add( mesh );
  
    renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(732, 411);
    renderer.domElement.id = 'projected-image';
    document.body.appendChild( renderer.domElement );
  
    render();
}
  
function animate() {
    mesh.rotation.x += .0;
    mesh.rotation.y += .0;
  
    render();
    requestAnimationFrame( animate );
}
  
function render() {
    renderer.render( scene, camera );
}
