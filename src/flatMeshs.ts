import { Mesh, Object3D, Quaternion, Vector3 } from 'three';

export function flatMeshs(obj: Object3D): Mesh[] {
    const meshs: Mesh[] = [];

    function each(obj: Object3D) {

        const mesh = obj as Mesh;
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