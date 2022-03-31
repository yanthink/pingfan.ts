import { defineConfig, IConfig } from 'dumi';
import path from 'path';

const chainWebpack: IConfig['chainWebpack'] = (memo) => {
  // 忽略 markdown-editor 的 svg 目录
  memo.module.rule('svg').exclude.add(path.resolve('packages/markdown-editor/src/svg')).end();

  // markdown-editor 的 svg 使用 babel 的 inline-react-svg 插件
  memo.module
    .rule('markdown-editor-svg')
    .test(/\.svg$/)
    .include.add(path.resolve('packages/markdown-editor/src/svg'))
    .end()
    .use('babel-loader')
    .loader('babel-loader')
    .end();
};

export default defineConfig({
  title: 'pingfan.ts',
  favicon:
    'https://user-images.githubusercontent.com/9554297/83762004-a0761b00-a6a9-11ea-83b4-9c8ff721d4b8.png',
  logo: 'https://user-images.githubusercontent.com/9554297/83762004-a0761b00-a6a9-11ea-83b4-9c8ff721d4b8.png',
  outputPath: 'docs-dist',
  mode: 'site',
  history: {
    type: 'hash',
  },
  publicPath: '/pingfan.ts/',
  locales: [['zh-CN', '中文']],
  extraBabelPlugins: ['inline-react-svg'],
  devServer: {
    port: 9001,
  },
  proxy: {
    '/api/': {
      target: 'http://localhost:8000',
      changeOrigin: true,
    },
    '/storage/': {
      target: 'http://localhost:8000',
      changeOrigin: true,
    },
  },
  // mfsu: {},
  chainWebpack,
  // more config: https://d.umijs.org/config
});
