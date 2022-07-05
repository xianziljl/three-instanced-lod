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
    maxCount?: number;
}

export class InstancedLOD extends Object3D {

    public meshs: Mesh[] = [];
    public positions: ArrayLike<number>;
    public rotations: ArrayLike<number>;
    public scales: ArrayLike<number>;
    public maxDistance: number;
    public maxCount: number;


    public bvhGeometry: BufferGeometry;

    public bvhHelper: MeshBVHVisualizer;
    public bvhMesh: Mesh;

    private cameraPos = new Vector3();

    private sphere = new Sphere();
    private dummy = new Object3D();

    public instancedMesh: InstancedMesh;
    

    constructor(options: InstancedLODOptions) {
        super();
        this.meshs = options.meshs;
        this.positions = options.positions;
        this.rotations = options.rotations ?? new Float32Array(options.positions.length).fill(0);
        this.scales = options.scales ?? new Float32Array(options.positions.length).fill(1);
        this.maxDistance = options.maxDistance ?? 100;
        this.maxCount = options.maxCount ?? 1000;

        this.bvhGeometry = new BufferGeometry();
        this.bvhGeometry.setAttribute('position', new BufferAttribute(this.positions, 3));

        const indices = [];
        const l = this.bvhGeometry.attributes.position.count;
        for (let i = 0; i < l; i++) {
            indices.push(i, i, i);
        }
        this.bvhGeometry.setIndex(indices);
        const bvh = new MeshBVH(this.bvhGeometry);
        this.bvhGeometry.boundsTree = bvh;

        const _mesh = options.meshs[0];

        this.instancedMesh = new InstancedMesh(_mesh.geometry, _mesh.material, this.maxCount);
        this.instancedMesh.instanceMatrix.setUsage(DynamicDrawUsage);
        this.add(this.instancedMesh);
    }

    public update(camera: Camera, frustum: Frustum) {
        const { boundsTree } = this.bvhGeometry;
        if (!boundsTree) return;

        const { cameraPos, sphere, dummy, instancedMesh, positions, maxDistance } = this;

        camera.getWorldPosition(cameraPos);
        sphere.center.copy(cameraPos);
        sphere.radius = this.maxDistance;

        const tempVec = new Vector3();
        const indices: Set<number> = new Set();
        const indexAttr = this.bvhGeometry.index;
        const posAttr = this.bvhGeometry.attributes.position;
        const vectors: Set<Vector3> = new Set();

        if (!indexAttr) return;

        let closestDistance = Infinity;
        
        boundsTree.shapecast({
            traverseBoundsOrder(box) {
                return box.distanceToPoint(cameraPos);
            },
            intersectsBounds(box, isLeaf, score, depth, nodeIndex) {
                if (score && score > closestDistance) {
                    return NOT_INTERSECTED;
                }

                const intersects = frustum.intersectsBox(box) && sphere.intersectsBox(box);
                return intersects ? INTERSECTED : NOT_INTERSECTED;
            },
            intersectsTriangle(triangle, triangleIndex, contained, depth) {
                if (indices.size < instancedMesh.count && frustum.containsPoint(triangle.a)) {

                    // const dist = triangle.a.distanceTo(cameraPos);
                    // const x = 1 - dist / maxDistance;
                    // const n = Math.random();
                    // if (n <= x) {
                        const va = indexAttr.getX(triangleIndex * 3);
                        indices.add(va);
                    // }
                }
            },
        })

        // console.log(vectors);

    

        // console.log(indices.size, instancedMesh.count);

        // if (instancedMesh.count > indices.size) {
        //     instancedMesh.count = indices.size;
        // } else {
        //     instancedMesh.count = this.maxCount;
        // }

        // console.log(instancedMesh.count)

        let i = 0;
        for (let index of indices) {
            if (i > instancedMesh.count - 1) return;

            tempVec.x = positions[index * 3 + 0];
            tempVec.y = positions[index * 3 + 1];
            tempVec.z = positions[index * 3 + 2];
            
            dummy.position.copy(tempVec);

            dummy.updateMatrix();
            instancedMesh.setMatrixAt(i, dummy.matrix);

            i++;
        }

        
        instancedMesh.instanceMatrix.needsUpdate = true;
    }
}