import { Camera, Mesh, Object3D } from 'three';
import { MeshBVH } from 'three-mesh-bvh';

interface Transforms{
    positions: Float32Array;
    rotations: Float32Array;
    scales: Float32Array;
}

export class InstancedLOD {
    public maxCount: number;
    public bvh: MeshBVH;

    constructor(model: Object3D, transforms: Transforms) {

    }

    public update(camera: Camera) {

    }
}