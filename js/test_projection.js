var camera;
var scene;
var renderer;
var mesh;
  
init();
animate();
  
function init() {
  
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 1000);
    
    // Place camera on x axis
// camera.position.set(0,0,0);
// camera.up = new THREE.Vector3(0,0,1);
// camera.lookAt(new THREE.Vector3(1,0,0));

    var light = new THREE.DirectionalLight( 0xffffff );
    light.position.set( 0, 1, 1 ).normalize();
    scene.add(light);
  
    var geometry = new THREE.CubeGeometry( 10, 10, 0.1);
    var material = new THREE.MeshPhongMaterial( { map: THREE.ImageUtils.loadTexture('images/projection.png') } );
 
    mesh = new THREE.Mesh(geometry, material );
    mesh.position.z = -10;
    mesh.rotation.x = Math.PI * 0.1;
    mesh.rotation.y = Math.PI * 0.1;
    scene.add( mesh );
  
    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );
  
    window.addEventListener( 'resize', onWindowResize, false );
  
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
  
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
    render();
}