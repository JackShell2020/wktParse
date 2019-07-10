import cjs from 'rollup-plugin-commonjs';
import node from 'rollup-plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';

const production = !process.env.ROLLUP_WATCH;

export default {
  input: 'src/index.js',
  output: [
    {
      file: 'bundle.js',
      name: 'WKTParser',
      format: 'iife'
    }
  ],
  plugins: [
    node(),
    cjs(),
    production && terser()
  ]
};
