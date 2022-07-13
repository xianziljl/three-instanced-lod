import { BufferAttribute, BufferGeometry, Camera, DynamicDrawUsage, Frustum, InstancedMesh, Matrix4, Mesh, MeshBasicMaterial, Object3D, Sphere, Vector3 } from 'three';
import { CONTAINED, INTERSECTED, MeshBVH, MeshBVHVisualizer, NOT_INTERSECTED } from 'three-mesh-bvh';

interface Transforms {
    positions: ArrayLike<number>;
    rotations: ArrayLike<number>;
    scales: ArrayLike<number>;
}

interface InstancedLODOptions {
    meshs: Mesh[];
    positions: ArrayLike<number>;
    rotations?: ArrayLike<number>;
    scales?: ArrayLike<number>;
    maxDistance?: number;
    minDistance?: number;
    maxCount?: number;
}

export class InstancedLOD extends Object3D {

    // public meshs: Mesh[] = [];
    public positions: ArrayLike<number>;
    public rotations: ArrayLike<number>;
    public scales: ArrayLike<number>;
    public maxDistance: number;
    public minDistance: number;
    public maxCount: number;


    public bvhGeometry: BufferGeometry;

    public bvhHelper: MeshBVHVisualizer;
    public bvhMesh: Mesh;

    private cameraPos = new Vector3();

    private sphere = new Sphere();
    private dummy = new Object3D();

    public meshs: InstancedMesh[];
    public levels = new Map<number, Set<number>>();
    public indices: Array<number> = [];


    constructor(options: InstancedLODOptions) {
        super();
        this.positions = options.positions;
        this.rotations = options.rotations ?? new Float32Array(options.positions.length).fill(0);
        this.scales = options.scales ?? new Float32Array(options.positions.length).fill(1);
        this.maxDistance = options.maxDistance ?? 100;
        this.minDistance = options.minDistance ?? 10;
        this.maxCount = options.maxCount ?? 1000;

        this.bvhGeometry = new BufferGeometry();
        this.bvhGeometry.setAttribute('position', new BufferAttribute(this.positions, 3));

        const _indices = [];
        const l = this.bvhGeometry.attributes.position.count;
        for (let i = 0; i < l; i++) {
            _indices.push(i, i, i);
            this.indices.push(i);
        }
        this.bvhGeometry.setIndex(_indices);
        const bvh = new MeshBVH(this.bvhGeometry);
        this.bvhGeometry.boundsTree = bvh;


        this.meshs = options.meshs.map(mesh => {
            const instancedMesh = new InstancedMesh(mesh.geometry, mesh.material, this.maxCount);
            instancedMesh.instanceMatrix.setUsage(DynamicDrawUsage);
            this.add(instancedMesh);
            return instancedMesh;
        })


        this.generateLOD();
    }

    public generateLOD() {
        const { levels, indices, bvhGeometry } = this;
        const { boundsTree } = bvhGeometry;

        if (!boundsTree) return;

        // 获取最大深度
        let maxDepth = 0;
        boundsTree.shapecast({
            intersectsBounds(box, isLeaf, score, depth) {
                if (depth > maxDepth) maxDepth = depth;
                return INTERSECTED;
            },
            intersectsTriangle() {
                return false;
            }
        });

        for (let i = 0; i < maxDepth; i++) {

            const set: Set<number> = new Set();
            const step = Math.pow(2, maxDepth - i);

            for (let j = 0, l = indices.length; j < l; j += step) {
                set.add(indices[j]);
            }

            levels.set(i, set);
        }
    }

    public update(camera: Camera, frustum: Frustum) {
        const { boundsTree } = this.bvhGeometry;
        if (!boundsTree) return;

        const { cameraPos, sphere, dummy, meshs, positions, maxCount, maxDistance, minDistance, levels } = this;

        camera.getWorldPosition(cameraPos);
        sphere.center.copy(cameraPos);
        sphere.radius = maxDistance;

        const tempVec = new Vector3();
        const indices: Set<number> = new Set();
        const indexAttr = this.bvhGeometry.index;

        if (!indexAttr) return;


        boundsTree.shapecast({
            intersectsBounds(box, isLeaf, score, depth, nodeIndex) {
                // sphere.radius = 
                const intersects = frustum.intersectsBox(box) && sphere.intersectsBox(box);
                return intersects ? INTERSECTED : NOT_INTERSECTED;
            },
            intersectsTriangle(triangle, triangleIndex, contained, depth) {

                if (frustum.containsPoint(triangle.a) && indices.size < maxCount) {

                    const d = triangle.a.distanceTo(cameraPos);

                    if (d > maxDistance) return false;

                    const maxLevel = levels.size - 1;

                    let l = Math.round((d - minDistance) / (maxDistance - minDistance) * maxLevel);
                    
                    if (l < 0) l = 0;
                    if (l > maxLevel) l = maxLevel;
                    l = maxLevel - l;
                    
                    const set = levels.get(l);

                    if (!set) return false;

                    const va = indexAttr.getX(triangleIndex * 3);

                    if (set.has(va)) {
                        indices.add(va);
                    }

                }
                return false;
            },
        });

        // console.log(maxDep)
        meshs.forEach(m => m.count = indices.size);
        // console.log(instancedMesh.count, indices.size);

        let i = 0;
        for (let index of indices) {
            tempVec.x = positions[index * 3 + 0];
            tempVec.y = positions[index * 3 + 1];
            tempVec.z = positions[index * 3 + 2];

            dummy.position.copy(tempVec);

            dummy.updateMatrix();
            meshs.forEach(m => m.setMatrixAt(i, dummy.matrix));

            i++;
        }


        meshs.forEach(m => m.instanceMatrix.needsUpdate = true);
    }
}