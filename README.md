# three-instanced-lod

用于在 three.js 大量重复物体，根据摄像机视锥范围渲染局部渲染，使用了 [instanced mesh](https://threejs.org/examples/?q=instanc#webgl_instancing_performance) 和 [three-mesh-bvh](https://github.com/gkjohnson/three-mesh-bvh)。

[Demo1](https://github.com/xianziljl/three-instanced-lod)


## 安装

```bash
# yarn
yarn add three-instanced-lod

# npm
npm install three-instanced-lod
```

## 使用
```javascript
import { InstancedLOD, flatMeshs } from 'three-instanced-lod';

const instancedLOD = new InstancedLOD({

    // 必填，用户实例化的 mesh，为 Mesh 数组, 可使用 flatMeshs 转换模型。
    meshs: [],

    // 必填，所有的位置信息，使用 Float32Array，三个数字一组，分别表示x y z.
    positions: [],

    // 所有的旋转信息，同 positions，旋转顺序为 xyz.
    rotations: [],

    // 所有的缩放信息，同 positions.
    scales: [],

    // 渲染最远距离，此距离以内物体将按距离控制渲染数量，大于此距离将不渲染
    maxDistance: 100,

    // 最近距离，此距离以内物体将全量渲染
    minDistance: 10,

    // 实例最大数量，如果数值设置较小，
    // 且最大距离设置的较远，视野范围内物体数量较多
    // 则有可能导致视野范围内物体无法全部渲染
    maxCount: 10000

})
```

## License

MIT
