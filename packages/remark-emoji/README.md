## Remark Emoji Plugin

基于 [emoji-toolkit](https://github.com/joypixels/emoji-toolkit) 实现的 remark plugin

### 安装

    npm install -S @pingfan.ts/remark-emoji

### 使用

```tsx
import remark from 'remark';
import remarkEmoji from '@pingfan.ts/remark-emoji';
import rehypeStringify from 'rehype-stringify';
import remarkRehype from 'remark-rehype';

const processor = remark()
  .use(remarkEmoji)
  .use(remarkRehype)
  .use(rehypeStringify);
```
