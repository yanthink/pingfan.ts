import type { Categories } from './Picker';

export interface Emoji {
  name: string;
  unicode_version: number;
  category: string;
  order: number;
  display: 0 | 1;
  shortname: string;
  shortname_alternates: string[];
  ascii: string[];
  humanform: 0 | 1;
  diversity_base: 0 | 1;
  diversity: string[] | null;
  diversity_children: string[];
  gender: string[];
  gender_children: string[];
  code_points: {
    base: string;
    fully_qualified: string;
    decimal: string;
    diversity_parent: string | null;
    gender_parent: string | null;
  };
  keywords: string[];
}

export interface EmojiData {
  [category: string]: Emoji[][];
}

export type RowsData = (Categories[number] | Emoji[])[];

const chunk = <T>(arr: T[], size: number): T[][] =>
  Array.from(
    {
      length: Math.ceil(arr.length / size),
    },
    (v, i) => arr.slice(i * size, i * size + size),
  );

export function createEmojiDataFromStrategy(strategy: { [key: string]: Emoji }): EmojiData {
  const emojiData: EmojiData = {};

  Object.keys(strategy)
    .sort((k1, k2) => strategy[k1].order - strategy[k2].order)
    .forEach((key) => {
      const emoji = strategy[key];

      if (emoji.diversity || emoji.category === 'modifier') {
        return;
      }

      const category = emoji.category.replace('regional', 'symbols');

      (emojiData[category] ??= []).push([
        emoji,
        ...emoji.diversity_children.map((childKey) => ({
          ...strategy[childKey],
          category,
        })),
      ]);
    });

  return emojiData;
}

export function rowsSelector(
  categories: Categories,
  emojiData: EmojiData,
  chunkSize = 9,
  modifier = 0,
  term = '',
): RowsData {
  return categories
    .map(({ category, title, shortname }) => {
      let emojis = emojiData[category]?.map((emojis) => emojis[modifier] || emojis[0]) || [];

      if (term) {
        const lowerTerm = term.toLowerCase();
        emojis = emojis.filter((emoji) => {
          return (
            emoji.shortname.indexOf(lowerTerm) > -1 ||
            emoji.shortname_alternates.some((str) => str.indexOf(lowerTerm) > -1) ||
            emoji.ascii.some((str) => str.indexOf(lowerTerm) > -1) ||
            emoji.keywords.some((str) => str.indexOf(lowerTerm) > -1)
          );
        });
      }

      return { category, title, shortname, emojis };
    })
    .filter(({ emojis }) => emojis.length > 0)
    .flatMap(({ category, title, shortname, emojis }) => [
      { category, title, shortname },
      ...chunk(emojis, chunkSize),
    ]);
}
