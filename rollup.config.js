import typescript from '@rollup/plugin-typescript';
import server from 'rollup-plugin-serve';

export default {
    input: 'index.ts',
    format: 'esm',
    output: {
        dir: 'temp',
        format: 'esm'
    },
    plugins: [
        typescript({ target: 'ES2017' }),
        server()
    ],
    external: id => /^three/.test(id),
}