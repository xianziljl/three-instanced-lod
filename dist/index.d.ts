// Generated by dts-bundle v0.7.3
// Dependencies for this module:
//   index.d.ts
//   ../three

declare module 'three-instanced-lod' {
    
    declare module 'three-instanced-lod/index//three-instanced-lod' {
        export { InstancedLOD } from 'three-instanced-lod/InstancedLOD';
        export { flatMeshs } from 'three-instanced-lod/flatMeshs';
    }
    
    declare module 'three-instanced-lod/InstancedLOD' {
        import { Camera, Frustum, InstancedMesh, Mesh, Object3D } from 'three';
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
            positions: ArrayLike<number>;
            rotations: ArrayLike<number>;
            scales: ArrayLike<number>;
            maxDistance: number;
            minDistance: number;
            maxCount: number;
            meshs: InstancedMesh[];
            constructor(options: InstancedLODOptions);
            update(camera: Camera, frustum: Frustum): void;
        }
        export {};
    }
    
    declare module 'three-instanced-lod/flatMeshs' {
        import { Mesh, Object3D } from 'three';
        export function flatMeshs(obj: Object3D): Mesh[];
    }
}
