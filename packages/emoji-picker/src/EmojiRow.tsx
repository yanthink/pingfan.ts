import React from 'react';
import type { EmojiItemProps } from './EmojiItem';
import EmojiItem from './EmojiItem';

export interface EmojiRowProps {
  emojiToolkit?: EmojiItemProps['emojiToolkit'];
  emojis: EmojiItemProps['emoji'][];
  size: EmojiItemProps['size'];
  onSelect?: EmojiItemProps['onSelect'];
  style?: React.CSSProperties;
}

const EmojiRow: React.FC<EmojiRowProps> = ({ emojis, style, ...restProps }) => {
  return (
    <div className="pf-emoji-picker-emoji-row" style={style}>
      {emojis.map((emoji) => (
        <EmojiItem {...restProps} key={emoji.shortname} emoji={emoji} />
      ))}
    </div>
  );
};

export default EmojiRow;
