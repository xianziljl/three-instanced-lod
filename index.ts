import { AmbientLight, AxesHelper, BasicDepthPacking, BasicShadowMap, BoxBufferGeometry, CameraHelper, DirectionalLight, DirectionalLightHelper, Frustum, Matrix4, Mesh, MeshLambertMaterial, MeshPhongMaterial, PCFShadowMap, PCFSoftShadowMap, PerspectiveCamera, PlaneBufferGeometry, Scene, sRGBEncoding, VSMShadowMap, WebGLRenderer } from 'three';
import { MapControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { InstancedLOD } from './src/InstancedLOD';

const scene = new Scene();


const renderer = new WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.type = PCFSoftShadowMap;
renderer.outputEncoding = sRGBEncoding;
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);


const camera = new PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100000);
camera.position.set(0, 20, 0);
camera.lookAt(0, 0, 0);
const cameraHelper = new CameraHelper(camera);
scene.add(cameraHelper);

const camera1 = camera.clone();


const helper = new AxesHelper(1000);
scene.add(helper);


const light = new AmbientLight(0xffffff, 0.3);
scene.add(light);
const dirLight = new DirectionalLight(0xffffff, 0.7);
const lightHelper = new DirectionalLightHelper(dirLight);
dirLight.rotateX(-Math.PI / 4);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;

const d = 20;

dirLight.shadow.camera.left = - d;
dirLight.shadow.camera.right = d;
dirLight.shadow.camera.top = d;
dirLight.shadow.camera.bottom = - d;


dirLight.position.set(70, 100, 50);
dirLight.lookAt(0, 0, 0);
scene.add(lightHelper);
scene.add(dirLight);


const controls = new MapControls(camera, renderer.domElement);
const planeGeom = new PlaneBufferGeometry(1000, 1000, 1000, 1000);
planeGeom.rotateX(-Math.PI / 2);
const planeMtl = new MeshPhongMaterial({ color: 0x222222 });
const plane = new Mesh(planeGeom, planeMtl);
plane.receiveShadow = true;
scene.add(plane);


const cubeGeom = new BoxBufferGeometry(0.2, 1, 0.2);
cubeGeom.translate(0, 0.5, 0);
const cube = new Mesh(cubeGeom, new MeshLambertMaterial({ color: 0xffffff }));
cube.castShadow = true;
cube.receiveShadow = true;

let currentCamera = camera;
document.getElementById('toggle')?.addEventListener('click', () => {
    currentCamera = currentCamera === camera ? camera1 : camera;
    controls.object = currentCamera;
})

window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

// const loader = new GLTFLoader();
// loader.load("./assets/Flower.glb", gltf => {
//     console.log(gltf, gltf.scene)
//     gltf.scene.children.forEach((item) => {
//         item.castShadow = true;
//         item.receiveShadow = true;
//         // meshs.push(item as Mesh);
//     })
//     gltf.scene.scale.set(3, 3, 3);
//     scene.add(gltf.scene);
// });

const positions = planeGeom.getAttribute('position').array;


let meshs: Mesh[] = [];
const instancedLOD = new InstancedLOD({
    meshs: [cube],
    positions,
    maxDistance: 500,
    maxCount: 1000
});
// instancedLOD.bvhHelper.position.y = 0.1;
scene.add(instancedLOD);

console.log(scene);

const frustum = new Frustum();
const cameraMatrix = new Matrix4();

let frame = 0;
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, currentCamera);

    if (frame % 2 == 0) {
        cameraMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
        frustum.setFromProjectionMatrix(cameraMatrix);
        instancedLOD.update(camera, frustum);
    }
    frame++;
}

animate();