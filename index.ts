import { AmbientLight, AxesHelper, CameraHelper, DirectionalLight, DirectionalLightHelper, Frustum, Matrix4, Mesh, MeshPhongMaterial, PerspectiveCamera, PlaneBufferGeometry, Scene, sRGBEncoding, WebGLRenderer } from 'three';
import { MapControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { InstancedLOD } from './src/InstancedLOD';

const scene = new Scene();

const renderer = new WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputEncoding = sRGBEncoding;
document.body.appendChild(renderer.domElement);

const camera = new PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100000);
camera.position.set(0, 10, 0);
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
dirLight.position.set(70, 100, 50);
dirLight.lookAt(0, 0, 0);
scene.add(lightHelper);
scene.add(dirLight);


const controls = new MapControls(camera, renderer.domElement);
const planeGeom = new PlaneBufferGeometry(1000, 1000, 1, 1);
planeGeom.rotateX(-Math.PI / 2);
const planeMtl = new MeshPhongMaterial({ color: 0x0c180a });
const plane = new Mesh(planeGeom, planeMtl);
scene.add(plane);


let currentCamera = camera;
document.getElementById('toggle')?.addEventListener('click', () => {
    currentCamera = currentCamera === camera ? camera1 : camera;
    controls.object = currentCamera;
});

window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});


const s = 1500;
const positions = new Float32Array(s * s);
const rotations = new Float32Array(s * s);
const scales = new Float32Array(s * s);
let n = 0;
for (let i = 0; i < s; i++) {
    for (let j = 0; j < s; j++) {
        const x = Math.random() * 1000 - 500;
        const z = Math.random() * 1000 - 500;
        positions[n + 0] = x;
        positions[n + 1] = 0;
        positions[n + 2] = z;

        const rotate = Math.random() * Math.PI;

        rotations[n + 0] = 0;
        rotations[n + 1] = rotate;
        rotations[n + 2] = 0;

        const scale = Math.random() + 0.5;
        scales[n + 0] = scale;
        scales[n + 1] = scale;
        scales[n + 2] = scale;

        n += 3;
    }
}

let instancedLOD: InstancedLOD;
new GLTFLoader().load('./assets/Grass.glb', grass => {

    const meshs: Mesh[] = [];
    grass.scene.children[0].children.forEach(item => {
        const mesh = item as Mesh;

        mesh.geometry.rotateX(-Math.PI / 2);
        mesh.geometry.translate(0, -0.1, 0);
        meshs.push(mesh.clone());
    });

    new GLTFLoader().load("./assets/Flower.glb", flower => {
        flower.scene.children.forEach((item) => {

            const mesh = item as Mesh;

            mesh.geometry.rotateX(Math.PI / 2);

            meshs.push(mesh.clone());
        });

        const options = {
            meshs,
            positions,
            rotations,
            scales,
            maxDistance: 100,
            minDistance: 15,
            maxCount: 10000
        }
        console.log(options);

        instancedLOD = new InstancedLOD(options);
        scene.add(instancedLOD);
    });
});


console.log(scene);

const frustum = new Frustum();
const cameraMatrix = new Matrix4();



let frame = 0;
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, currentCamera);

    if (instancedLOD && frame % 5 == 0) {
        cameraMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
        frustum.setFromProjectionMatrix(cameraMatrix);
        frustum.planes.forEach(plane => {
            plane.constant += 2;
        })
        instancedLOD.update(camera, frustum);
    }
    frame++;
}

animate();