## React Emoji Picker

基于 [emoji-toolkit](https://github.com/joypixels/emoji-toolkit) 实现的 emoji picker

![截图](https://yanthink.github.io/pingfan.ts/images/emoji-picker.png)

[使用文档](https://yanthink.github.io/pingfan.ts/#/emoji-picker)

### 安装

    npm install -S @pingfan.ts/emoji-picker

### 使用

```jsx
import React, { useState } from 'react';
import type { EmojiItemProps } from '@pingfan.ts/emoji-picker/es/EmojiItem';
import EmojiPicker from '@pingfan.ts/emoji-picker';
import emojiToolkit from 'emoji-toolkit';
import 'emoji-assets/sprites/joypixels-sprite-32.min.css'; // 需要安装 emoji-assets@^6.6.0
import './index.css';

// 全局设置
emojiToolkit.sprites = true; // sprites = true 需要安装 emoji-assets@^6.6.0 依赖并引入 emoji-assets 对应的 css 样式
emojiToolkit.spriteSize = '32';

function App() {
  const [emoji, setEmoji] = useState<EmojiItemProps['emoji']>();
  console.info(emoji);

  return (
    <div className="container">
      <EmojiPicker
        // sprites = true 需要引入 emoji-assets 对应的 css 样式
        emojiToolkit={{ sprites: true, spriteSize: '32' }}
        onSelect={setEmoji}
        // 启用搜索，搜索规则是 匹配 shortname、shortname_alternates、ascii 和 keywords 字段
        search
      />
      {emoji && (
        <div className="preview">
          <div>shortname：{emoji.shortname}</div>
          <div>unicode：{emojiToolkit.shortnameToUnicode(emoji.shortname)}</div>
          <div>
            emoji：
            <span
              dangerouslySetInnerHTML={{ __html: emojiToolkit.shortnameToImage(emoji.shortname) }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
```

### API

| 属性名 | 描述 | 类型 | 默认值	|
| --- | --- | --- | --- |
| categories | Emoji 分类 | `Categories` | -- |
| emojiToolkit | [emoji-toolkit 选项](https://github.com/joypixels/emoji-toolkit/blob/master/USAGE.md) ，不影响全局设置 | `EmojiItemProps['emojiToolkit']` | -- |
| recentCount | 常用表情个数 | `number` | 36 |
| size | 网格大小 | `number` | 40 |
| showColCount | 显示列数 | `number` | 9 |
| showRowCount | 显示行数 | `number` | 6 |
| search | 启用搜索，搜索规则是匹配 shortname、shortname_alternates、ascii 和 keywords 字段 | `boolean` | -- |
| onSelect | 选择 emoji 表情时回调 | `(emoji: EmojiItemProps['emoji']) => void` | -- |
| renderHeader | 自定义头部 | `(activeCategory: Category) => React.ReactNode` | -- |

#### 默认 Emoji 分类

```ts
const defaultCategories: Categories = [
  {
    category: 'recent',
    title: '常用',
    shortname: ':clock3:',
  },
  {
    category: 'people',
    title: '表情符号与人物',
    shortname: ':smile:',
  },
  {
    category: 'nature',
    title: '动物与自然',
    shortname: ':hamster:',
  },
  {
    category: 'food',
    title: '食物与饮料',
    shortname: ':pizza:',
  },
  {
    category: 'activity',
    title: '活动',
    shortname: ':soccer:',
  },
  {
    category: 'travel',
    title: '旅行与地点',
    shortname: ':earth_americas:',
  },
  {
    category: 'objects',
    title: '物体',
    shortname: ':bulb:',
  },
  {
    category: 'symbols',
    title: '符号',
    shortname: ':symbols:',
  },
  {
    category: 'flags',
    title: '旗帜',
    shortname: ':flag_cn:',
  },
];
```
