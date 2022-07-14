import { Object3D, Vector3, Sphere, BufferGeometry, BufferAttribute, InstancedMesh, DynamicDrawUsage, Quaternion, Mesh } from 'three';
import { MeshBVH, INTERSECTED, NOT_INTERSECTED } from 'three-mesh-bvh';

class InstancedLOD extends Object3D {
    constructor(options) {
        var _a, _b, _c, _d, _e;
        super();
        this.cameraPos = new Vector3();
        this.sphere = new Sphere();
        this.dummy = new Object3D();
        this.levels = new Map();
        this.positions = options.positions;
        this.rotations = (_a = options.rotations) !== null && _a !== void 0 ? _a : new Float32Array(options.positions.length).fill(0);
        this.scales = (_b = options.scales) !== null && _b !== void 0 ? _b : new Float32Array(options.positions.length).fill(1);
        this.maxDistance = (_c = options.maxDistance) !== null && _c !== void 0 ? _c : 100;
        this.minDistance = (_d = options.minDistance) !== null && _d !== void 0 ? _d : 10;
        this.maxCount = (_e = options.maxCount) !== null && _e !== void 0 ? _e : 1000;
        this.bvhGeometry = new BufferGeometry();
        this.bvhGeometry.setAttribute('position', new BufferAttribute(this.positions, 3));
        const _indices = [];
        const l = this.bvhGeometry.attributes.position.count;
        for (let i = 0; i < l; i++) {
            _indices.push(i, i, i);
        }
        this.bvhGeometry.setIndex(_indices);
        const bvh = new MeshBVH(this.bvhGeometry);
        this.bvhGeometry.boundsTree = bvh;
        this.meshs = options.meshs.map(mesh => {
            const instancedMesh = new InstancedMesh(mesh.geometry, mesh.material, this.maxCount);
            instancedMesh.instanceMatrix.setUsage(DynamicDrawUsage);
            this.add(instancedMesh);
            return instancedMesh;
        });
        this.generateLOD();
    }
    generateLOD() {
        const { levels, bvhGeometry } = this;
        const { boundsTree } = bvhGeometry;
        const indexAttr = bvhGeometry.index;
        if (!boundsTree || !indexAttr)
            return;
        let maxDepth = 0;
        boundsTree.shapecast({
            intersectsBounds(box, isLeaf, score, depth) {
                if (depth > maxDepth)
                    maxDepth = depth;
                return INTERSECTED;
            },
            intersectsTriangle() {
                return false;
            }
        });
        for (let i = 0; i < maxDepth; i++) {
            const set = new Set();
            const step = Math.pow(2, maxDepth - i);
            for (let j = 0, l = indexAttr.count; j < l; j += step) {
                set.add(indexAttr.getX(j * 3));
            }
            levels.set(i, set);
        }
    }
    update(camera, frustum) {
        const { boundsTree } = this.bvhGeometry;
        if (!boundsTree)
            return;
        const { cameraPos, sphere, dummy, meshs, maxCount, maxDistance, minDistance, levels } = this;
        camera.getWorldPosition(cameraPos);
        sphere.center.copy(cameraPos);
        sphere.radius = maxDistance;
        const tempVec = new Vector3();
        const indices = new Set();
        const indexAttr = this.bvhGeometry.index;
        if (!indexAttr)
            return;
        const maxLevel = levels.size - 1;
        boundsTree.shapecast({
            intersectsBounds(box, isLeaf, score, depth, nodeIndex) {
                const intersects = (frustum.intersectsBox(box) && sphere.intersectsBox(box));
                return intersects ? INTERSECTED : NOT_INTERSECTED;
            },
            intersectsTriangle(triangle, triangleIndex, contained, depth) {
                if (frustum.containsPoint(triangle.a) && indices.size < maxCount) {
                    const d = triangle.a.distanceTo(cameraPos);
                    if (d > maxDistance)
                        return false;
                    let l = Math.round((d - minDistance) / (maxDistance - minDistance) * maxLevel);
                    if (l < 0)
                        l = 0;
                    if (l > maxLevel)
                        l = maxLevel;
                    l = maxLevel - l;
                    const set = levels.get(l);
                    if (!set)
                        return false;
                    const va = indexAttr.getX(triangleIndex * 3);
                    if (set.has(va)) {
                        indices.add(va);
                    }
                }
                return false;
            },
        });
        meshs.forEach(m => m.count = indices.size);
        const { positions, rotations, scales } = this;
        let i = 0;
        for (let index of indices) {
            tempVec.x = positions[index * 3 + 0];
            tempVec.y = positions[index * 3 + 1];
            tempVec.z = positions[index * 3 + 2];
            dummy.position.copy(tempVec);
            tempVec.x = scales[index * 3 + 0];
            tempVec.y = scales[index * 3 + 1];
            tempVec.z = scales[index * 3 + 2];
            dummy.scale.copy(tempVec);
            dummy.rotation.x = rotations[index * 3 + 0];
            dummy.rotation.y = rotations[index * 3 + 1];
            dummy.rotation.z = rotations[index * 3 + 2];
            dummy.updateMatrix();
            meshs.forEach(m => m.setMatrixAt(i, dummy.matrix));
            i++;
        }
        meshs.forEach(m => m.instanceMatrix.needsUpdate = true);
    }
}

function flatMeshs(obj) {
    const meshs = [];
    function each(obj) {
        const mesh = obj;
        if (mesh.isMesh) {
            meshs.push(mesh);
        }
        if (mesh.children) {
            mesh.children.forEach(child => each(child));
        }
    }
    each(obj);
    const res = meshs.map(item => {
        const { geometry, material } = item;
        const geom = geometry.clone();
        const position = item.getWorldPosition(new Vector3());
        const quaternion = item.getWorldQuaternion(new Quaternion());
        const scale = item.getWorldScale(new Vector3());
        geom.scale(scale.x, scale.y, scale.z);
        geom.applyQuaternion(quaternion);
        geom.translate(position.x, position.y, position.z);
        geom.computeVertexNormals();
        return new Mesh(geom, material);
    });
    return res;
}

export { InstancedLOD, flatMeshs };
