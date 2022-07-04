import { AmbientLight, AxesHelper, DirectionalLight, PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import { MapControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const scene = new Scene();
const renderer = new WebGLRenderer();
const camera = new PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100000);
const helper = new AxesHelper(1000);
const light = new AmbientLight(0xffffff, 0.4);
const dirLight = new DirectionalLight(0xffffff, 0.6)
const controls = new MapControls(camera, renderer.domElement);

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
scene.add(helper);
scene.add(light);
scene.add(dirLight);
camera.position.set(2, 2, 2);
camera.lookAt(0, 0, 0);

window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

const loader = new GLTFLoader();
loader.load("./assets/Flower.glb", gltf => {
    console.log(gltf);
    scene.add(gltf.scene);
})

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

animate();