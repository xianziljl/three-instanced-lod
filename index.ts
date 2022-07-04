import { AmbientLight, AxesHelper, PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import { MapControls } from 'three/examples/jsm/controls/OrbitControls';

const scene = new Scene();
const renderer = new WebGLRenderer();
const camera = new PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 100000);
const helper = new AxesHelper(1000);
const light = new AmbientLight(0xffffff, 1);
const controls = new MapControls(camera, renderer.domElement);

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
scene.add(helper);
scene.add(light);
camera.position.set(0, 0, 1000);
camera.lookAt(0, 0, 0);

window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

animate();