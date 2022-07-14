import { BufferAttribute, BufferGeometry, Camera, DynamicDrawUsage, Frustum, InstancedMesh, Mesh, Object3D, Sphere, Vector3 } from 'three';
import { INTERSECTED, MeshBVH, NOT_INTERSECTED } from 'three-mesh-bvh';

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
    // 所有点的位置
    public positions: ArrayLike<number>;
    // 所有点的旋转
    public rotations: ArrayLike<number>;
    // 所有点的缩放
    public scales: ArrayLike<number>;
    // 视野最大可见距离，以外将不可见
    public maxDistance: number;
    // 最小距离，以内将全部可见
    public minDistance: number;
    // 实例化网格最大数量
    public maxCount: number;

    // 用于 bvh 的
    private bvhGeometry: BufferGeometry;
    // 相机位置
    private cameraPos = new Vector3();
    // 基于 maxDistance 的球体
    private sphere = new Sphere();
    // 用来逐个更新网格时临时保存变换信息
    private dummy = new Object3D();
    // LOD 信息
    private levels = new Map<number, Set<number>>();

    // 生成的实例化网格，为多个
    public meshs: InstancedMesh[];

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
            // this.indices.push(i);
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

    /**
     * 根据 bvh 最大层级数，生成对应层数的标记点
     * @returns void
     */
    private generateLOD() {
        const { levels, bvhGeometry } = this;
        const { boundsTree } = bvhGeometry;

        const indexAttr = bvhGeometry.index;

        if (!boundsTree || !indexAttr) return;

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

            for (let j = 0, l = indexAttr.count; j < l; j += step) {
                set.add(indexAttr.getX(j * 3));
            }

            levels.set(i, set);
        }
    }

    /**
     * 
     * @param camera 相机
     * @param frustum 视锥，可适当扩展视锥范围以避免近处物体消失
     * @returns void
     */
    public update(camera: Camera, frustum: Frustum) {

        const { boundsTree } = this.bvhGeometry;
        if (!boundsTree) return;

        const { cameraPos, sphere, dummy, meshs, maxCount, maxDistance, minDistance, levels } = this;

        camera.getWorldPosition(cameraPos);
        sphere.center.copy(cameraPos);
        sphere.radius = maxDistance;

        const tempVec = new Vector3();
        const indices: Set<number> = new Set();
        const indexAttr = this.bvhGeometry.index;

        if (!indexAttr) return;

        const maxLevel = levels.size - 1;

        boundsTree.shapecast({
            intersectsBounds(box, isLeaf, score, depth, nodeIndex) {
                const intersects = (frustum.intersectsBox(box) && sphere.intersectsBox(box));
                return intersects ? INTERSECTED : NOT_INTERSECTED;
            },
            intersectsTriangle(triangle, triangleIndex, contained, depth) {

                if (frustum.containsPoint(triangle.a) && indices.size < maxCount) {

                    const d = triangle.a.distanceTo(cameraPos);

                    if (d > maxDistance) return false;

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