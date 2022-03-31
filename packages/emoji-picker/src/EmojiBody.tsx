import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import strategy from 'emoji-toolkit/emoji.json';
import store from 'store';
import throttle from 'lodash/throttle';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import type { ListProps } from 'react-virtualized/dist/commonjs/List';
import List from 'react-virtualized/dist/commonjs/List';
import { createEmojiDataFromStrategy, rowsSelector } from './utils';
import type { Categories, Category } from './Picker';
import type { RowsData } from './utils';
import type { EmojiItemProps } from './EmojiItem';
import type { ModifiersProps } from './Modifiers';
import EmojiRow from './EmojiRow';
import Modifiers from './Modifiers';

export interface EmojiBodyInstance {
  jumpToCategory(key: string): void;
}

export interface EmojiBodyProps {
  emojiToolkit?: EmojiItemProps['emojiToolkit'];
  categories: Categories;
  modifier: number;
  term: string;
  recentCount: number;
  size: number;
  chunkSize: number;
  search?: boolean;
  onSelect?: EmojiItemProps['onSelect'];
  onModifierChange?: ModifiersProps['onChange'];
  onActiveCategoryChange?: (key: Category) => void;
}

const emojiData = createEmojiDataFromStrategy(strategy);

const EmojiBody = forwardRef<EmojiBodyInstance, EmojiBodyProps>((props, ref) => {
  const listRef = useRef<List>();
  const recentKeysRef = useRef<string[]>(store.get('emoji-recent', []));
  const recentKeysHasChangeRef = useRef(false);
  const lastActiveCategoryRef = useRef<Category>();
  const lastScrollTopRef = useRef(0);

  const { emojiToolkit, categories, modifier, term, recentCount, size, chunkSize } = props;

  const getRecentRows = (recentKeys: string[]) => {
    const recentCategory = categories.find(({ category }) => category === 'recent');

    if (recentCategory && recentCount > 0) {
      const emojiData = {
        recent: recentKeys.map((key) => [{ ...strategy[key], category: 'recent' }]),
      };

      return rowsSelector([recentCategory], emojiData, chunkSize);
    }

    return [];
  };

  const [recentRows, setRecentRows] = useState<RowsData>(getRecentRows(recentKeysRef.current));

  useEffect(() => {
    setRecentRows(getRecentRows(recentKeysRef.current));
  }, [chunkSize]);

  let rows = useMemo(() => {
    return rowsSelector(categories, emojiData, chunkSize, modifier, term);
  }, [categories, emojiData, chunkSize, modifier, term]);

  if (!term && recentRows.length > 0) {
    rows = recentRows.concat(rows);
  }

  useImperativeHandle(
    ref,
    () => ({
      jumpToCategory(category) {
        const index = rows.findIndex((row) => 'category' in row && row.category === category);
        listRef.current?.scrollToPosition(index * size);
      },
    }),
    [rows],
  );

  const getActiveCategory = (scrollTop = 0) => {
    if (rows.length === 0) return undefined;

    let index = 0;
    let top = 0;

    while (top < scrollTop) {
      top += size;

      if (top <= scrollTop) {
        index += 1;
      }
    }

    const currentRow = rows[index];

    if (Array.isArray(currentRow)) {
      return currentRow[0].category as Category;
    }

    return currentRow.category;
  };

  const onScroll: ListProps['onScroll'] = throttle(({ scrollTop }) => {
    lastScrollTopRef.current = scrollTop;
    const activeCategory = getActiveCategory(scrollTop);
    if (activeCategory !== lastActiveCategoryRef.current) {
      lastActiveCategoryRef.current = activeCategory;

      if (activeCategory === 'recent' && recentKeysHasChangeRef.current) {
        recentKeysHasChangeRef.current = false;
        setRecentRows(getRecentRows(recentKeysRef.current));
      }

      activeCategory && props.onActiveCategoryChange?.(activeCategory);
    }
  }, 100);

  const handleEmojiSelect: EmojiItemProps['onSelect'] = (emoji) => {
    const key = emoji.code_points!.base;
    recentKeysHasChangeRef.current = key !== recentKeysRef.current[0];

    recentKeysRef.current.unshift(key);
    const recentKeys = [...new Set(recentKeysRef.current)].slice(0, recentCount);

    store.set('emoji-recent', recentKeys);

    if (emoji.category !== 'recent' && recentKeysRef.current.length <= recentCount) {
      setRecentRows(getRecentRows(recentKeys));
    }

    recentKeysRef.current = recentKeys;

    props.onSelect?.(emoji);
  };

  const rowRenderer: ListProps['rowRenderer'] = ({ key, index, style }) => {
    const row = rows[index];

    if (Array.isArray(row)) {
      return (
        <EmojiRow
          key={key}
          emojiToolkit={emojiToolkit}
          emojis={row}
          size={size}
          style={style}
          onSelect={handleEmojiSelect}
        />
      );
    }

    return (
      <div key={key} className="pf-emoji-picker-body-head" style={style}>
        <h2 className="pf-emoji-picker-body-head-title">{row.title}</h2>
        {index === 0 && (
          <div className="pf-emoji-picker-body-head-decoration">
            <Modifiers
              active={modifier}
              onChange={(modifier) => props.onModifierChange?.(modifier)}
            />
          </div>
        )}
      </div>
    );
  };

  // useEffect(() => {
  //   onScroll({ scrollTop: lastScrollTopRef.current } as any);
  // }, [recentRows]);

  return (
    <div className="pf-emoji-picker-body" style={{ top: size + (props.search ? 46 : 0) }}>
      <AutoSizer>
        {({ width, height }) => (
          <List
            // @ts-ignore
            ref={listRef}
            width={width}
            height={height}
            onScroll={onScroll}
            rowCount={rows.length}
            rowHeight={size}
            rowRenderer={rowRenderer}
          />
        )}
      </AutoSizer>
    </div>
  );
});

export default React.memo(EmojiBody, (prevProps, nextProps) => {
  return (
    JSON.stringify(prevProps.emojiToolkit) === JSON.stringify(nextProps.emojiToolkit) &&
    JSON.stringify(prevProps.categories) === JSON.stringify(nextProps.categories) &&
    prevProps.modifier === nextProps.modifier &&
    prevProps.term === nextProps.term &&
    prevProps.recentCount === nextProps.recentCount &&
    prevProps.size === nextProps.size &&
    prevProps.search === nextProps.search &&
    prevProps.chunkSize === nextProps.chunkSize
  );
});
