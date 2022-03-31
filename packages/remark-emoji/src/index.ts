import { findAndReplace, Node } from 'mdast-util-find-and-replace';
// @ts-ignore
import emojiToolkit from 'emoji-toolkit';

export default function remarkEmoji() {
  // remark 插件 tree 格式是 mdast, rehype 插件 格式是 hast。https://github.com/syntax-tree/mdast-util-to-hast
  function transform(mdast: Node) {
    const unicodeCharRegexCached = emojiToolkit.unicodeCharRegex();
    const unicodeChar = emojiToolkit.escapeRegExp(unicodeCharRegexCached);
    const shortnames = emojiToolkit.shortnames;
    const findRegExp = new RegExp(`${unicodeChar}|${shortnames}`, 'gi');

    findAndReplace(mdast, findRegExp, (match: string) => {
      // let shortname: string = emojiToolkit.replaceAll(match, unicodeCharRegexCached);
      let shortname: string = match[0] !== ':' ? emojiToolkit.shortnameLookup[match] : match;

      if (!shortname) {
        return false;
      }
      if (!(shortname in emojiToolkit.emojiList)) {
        if (!(shortname in emojiToolkit.altShortNames)) {
          return false;
        }
        shortname = emojiToolkit.altShortNames[shortname];
      }

      const unicode = emojiToolkit.emojiList[shortname].uc_full!;
      const fname = emojiToolkit.emojiList[shortname].uc_base!;
      const category =
        fname.indexOf('-1f3f') >= 0 ? 'diversity' : emojiToolkit.emojiList[shortname].category;
      const title = emojiToolkit.imageTitleTag ? shortname : '';
      const size =
        emojiToolkit.spriteSize == '32' || emojiToolkit.spriteSize == '64'
          ? emojiToolkit.spriteSize
          : '32';
      const ePath =
        emojiToolkit.defaultPathPNG !== emojiToolkit.imagePathPNG
          ? emojiToolkit.imagePathPNG
          : emojiToolkit.defaultPathPNG + emojiToolkit.emojiSize + '/';
      const alt = emojiToolkit.unicodeAlt ? emojiToolkit.convert(unicode.toUpperCase()) : shortname;

      if (emojiToolkit.sprites) {
        return {
          type: 'text',
          value: alt,
          data: {
            hName: 'span',
            hProperties: {
              className: ['joypixels', `joypixels-${size}-${category}`, `_${fname}`],
              title,
            },
            hChildren: [{ type: 'text', value: alt }],
          },
        };
      }

      return {
        type: 'image',
        alt,
        title,
        url: `${ePath}${fname}${emojiToolkit.fileExtension}`,
      };
    });

    return mdast;
  }

  return transform;
}
