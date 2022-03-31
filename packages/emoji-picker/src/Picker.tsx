import React, { useRef, useState } from 'react';
import classnames from 'classnames';
import store from 'store';
import type { EmojiItemProps } from './EmojiItem';
import EmojiItem from './EmojiItem';
import type { EmojiBodyInstance, EmojiBodyProps } from './EmojiBody';
import EmojiBody from './EmojiBody';
import './style.less';

export type Category =
  | 'recent'
  | 'people'
  | 'nature'
  | 'food'
  | 'activity'
  | 'travel'
  | 'objects'
  | 'symbols'
  | 'flags';
export type Categories = { category: Category; title: string; shortname: string }[];

export interface PickerProps {
  /**
   * @description Emoji 分类
   */
  categories?: Categories;
  /**
   * @description [emoji-toolkit 选项](https://github.com/joypixels/emoji-toolkit/blob/master/USAGE.md) ，不影响全局设置
   */
  emojiToolkit?: EmojiItemProps['emojiToolkit'];
  /**
   * @description 常用表情个数
   * @default 36
   */
  recentCount?: number;
  /**
   * @description 网格大小
   * @default 40
   */
  size?: number;
  /**
   * @description 显示列数
   * @default 9
   */
  showColCount?: number;
  /**
   * @description 显示行数
   * @default 6
   */
  showRowCount?: number;
  /**
   * @description 启用搜索，搜索规则是匹配 shortname、shortname_alternates、ascii 和 keywords 字段
   */
  search?: boolean;
  /**
   * @description 选择 emoji 表情时回调
   */
  onSelect?: EmojiItemProps['onSelect'];
  /**
   * @description 自定义头部
   */
  renderHeader?: (activeCategory: Category) => React.ReactNode;
}

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

const Picker: React.FC<PickerProps> = (props) => {
  const emojiContentRef = useRef<EmojiBodyInstance>(null);

  const {
    emojiToolkit,
    categories = defaultCategories,
    recentCount = 36,
    size = 40,
    showColCount = 9,
    showRowCount = 6,
  } = props;

  const [activeCategory, setActiveCategory] = useState<Category>(categories[0].category);
  const [modifier, setModifier] = useState(store.get('emoji-modifier', 0));
  const [term, setTerm] = useState('');

  const renderHeader = () => {
    return (
      <header className="pf-emoji-picker-header">
        <ul className="pf-emoji-picker-header-menu" style={{ height: size }}>
          {categories.map(({ category, title, shortname }) =>
            recentCount < 1 && category === 'recent' ? null : (
              <li
                key={category}
                className={classnames('pf-emoji-picker-header-menu-item', {
                  'pf-emoji-picker-header-menu-item-active': activeCategory === category,
                })}
                title={title}
              >
                <EmojiItem
                  emojiToolkit={{ ...emojiToolkit, imageTitleTag: false }}
                  emoji={{ shortname }}
                  size={size}
                  onSelect={() => {
                    emojiContentRef.current?.jumpToCategory(category);
                  }}
                />
              </li>
            ),
          )}
        </ul>
      </header>
    );
  };

  const renderSearch = () => {
    if (props.search) {
      return (
        <div className="pf-emoji-picker-search">
          <input
            className="pf-emoji-picker-search-input"
            onChange={(e) => setTerm(e.target.value)}
          />
        </div>
      );
    }
  };

  const onModifierChange = (modifier: number) => {
    setModifier(modifier);
    store.set('emoji-modifier', modifier);
  };

  return (
    <div
      className="pf-emoji-picker-dialog"
      style={{
        width: size * showColCount + 16,
        height: size * showRowCount + size + (props.search ? 46 : 0),
      }}
    >
      {props.renderHeader?.(activeCategory) || renderHeader()}
      {renderSearch()}
      <EmojiBody
        ref={emojiContentRef}
        emojiToolkit={emojiToolkit}
        categories={categories}
        modifier={modifier}
        term={term}
        recentCount={recentCount}
        size={size}
        chunkSize={showColCount}
        search={props.search}
        onSelect={props.onSelect}
        onModifierChange={onModifierChange}
        onActiveCategoryChange={setActiveCategory}
      />
    </div>
  );
};

export default Picker;
