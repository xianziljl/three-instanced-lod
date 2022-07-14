import typescript from '@rollup/plugin-typescript';
import server from 'rollup-plugin-serve';
import dtsBundle from 'rollup-plugin-dts-bundle';

const ENV = process.env.NODE_ENV;
const isProd = ENV === "production";

const config = isProd ? {

    input: 'src/index.ts',
    format: 'esm',
    output: {
        dir: 'dist',
        format: 'esm'
    },
    plugins: [
        typescript({
            target: 'ES2017',
            compilerOptions: {
                declaration: true,
                outDir: 'dist'
            }
        }),
        dtsBundle({
            bundle: {
                name: 'three-instanced-lod',
                main: 'dist/src/index.d.ts',
                out: '../typings.d.ts',
                removeSource: true,
            },
            deleteOnComplete: ['dist/main.d.ts', 'dist/src']
        })
    ],
    external: id => /^three/.test(id),
    
} : {

    input: 'main.ts',
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

export default config;