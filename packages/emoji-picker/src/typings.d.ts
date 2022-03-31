declare module '*.less';
declare module 'emoji-toolkit/emoji.json';
declare module 'classnames';

declare namespace EmojiToolkit {
  interface Emoji {
    uc_base?: string;
    uc_full?: string;
    shortnames?: string[];
    category?: string;
  }

  interface Options {
    emojiSize: '32' | '64' | '128';
    imagePathPNG: string;
    fileExtension: '.png' | '.svg';
    greedyMatch: boolean;
    blacklistChars: string;
    imageTitleTag: boolean;
    sprites: boolean;
    spriteSize: '32' | '64' | '128';
    unicodeAlt: boolean;
    ascii: boolean;
    riskyMatchAscii: boolean;
  }

  interface EmojiToolkitStatic extends Options {
    readonly emojiVersion: string;

    readonly shortnames: string;

    readonly shortnameLookup: Record<string, string>;

    readonly defaultPathPNG: string;

    emojiList: Record<string, Emoji>;

    altShortNames: Record<string, string>;

    asciiRegexp: string;

    regAsciiRisky: RegExp;

    regAscii: RegExp;

    convert(unicode: string): string;

    init(): void;

    toImage(): string;

    unicodeToImage(str: string): string;

    unifyUnicode(str: string): string;

    shortnameToAscii(str: string): string;

    shortnameToUnicode(str: string): string;

    shortnameToImage(str: string): string;

    toShort(str: string): string;

    escapeHTML(string: string): string;

    unescapeHTML(string: string): string;

    shortnameConversionMap(): Record<string, string>;

    unicodeCharRegex(): string;

    mapEmojiList(addToMapStorage: (unicode: string, shortname: string) => void): void;

    mapUnicodeToShort(): string;

    memorizeReplacement(): void;

    mapUnicodeCharactersToShort(): Record<string, string>;

    objectFlip<T extends Record<keyof T, any>>(
      obj: T,
    ): {
      [V in T[keyof T]]: {
        [K in keyof T]: T[K] extends V ? K : never;
      }[keyof T];
    };

    escapeRegExp(string: string): string;

    replaceAll(string: string, find: string): string;
  }
}

declare module 'emoji-toolkit' {
  const emojiToolkit: EmojiToolkit.EmojiToolkitStatic;
  export default emojiToolkit;
}
