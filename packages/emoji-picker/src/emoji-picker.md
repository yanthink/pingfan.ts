---
nav:
  title: EmojiPicker
  path: /emoji-picker
---

### 基本用法

<code src="../demos/index.tsx"></code>

<API src="./Picker.tsx"></API>

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
