const _ = require('lodash');

class Parse5Parseable {
  constructor(htmlText) {
    this.htmlText = htmlText;
    this.text = htmlText;
    this.currentCharIndex = 0;
    this.phpMeta = [];
    this.phpCache = [];
    this.formattedHTMLText = htmlText;
    this.parse();
    this.format();
  }

  parse() {
    while (this.text.length > 0) {
      this.consume();
    }
  }

  consume() {
    if (!(this.handleOpenTag() || this.handleCloseTag())) {
      this.noop();
    }
  }

  format() {
    let phpMetaIndex = 0,
      offset = 0;
    while (this.phpMeta[phpMetaIndex + 1]) {
      const phpOpenIndex = this.phpMeta[phpMetaIndex].index,
        phpCloseIndex = this.phpMeta[phpMetaIndex + 1].index + this.phpMeta[phpMetaIndex + 1].length,
        phpStartIndex = phpOpenIndex + this.phpMeta[phpMetaIndex].length,
        phpEndIndex = phpCloseIndex - this.phpMeta[phpMetaIndex + 1].length;

      this.phpCache.push({
        open: phpOpenIndex,
        close: phpCloseIndex,
        start: phpStartIndex,
        end: phpEndIndex,
        text: this.htmlText.substr(phpStartIndex, phpEndIndex - phpStartIndex).replace(/^\s+/, '')
      });
      phpMetaIndex += 2;
    }
    this.phpCache.forEach((phpCacheMeta, phpCacheMetaIndex) => {
      let marker = `<!--[${phpCacheMetaIndex}]-->`,
        spliceStartIndex = (phpCacheMeta.open - offset),
        spliceEndIndex = (phpCacheMeta.close - offset),
        spliceSize = (spliceEndIndex - spliceStartIndex);
      this.formattedHTMLText = this.spliceString(this.formattedHTMLText, spliceStartIndex, spliceSize, marker);
      offset += spliceSize - marker.length;
    })
  }

  spliceString(str, index, count, add) {
    // copied from http://stackoverflow.com/questions/20817618/is-there-a-splice-method-for-strings
    // We cannot pass negative indexes dirrectly to the 2nd slicing operation.
    if (index < 0) {
      index = str.length + index;
      if (index < 0) {
        index = 0;
      }
    }

    return str.slice(0, index) + (add || "") + str.slice(index + count);
  }

  noop() {
    this.text = this.text.substr(1);
    this.currentCharIndex++;
  }

  handleOpenTag() {
    const openingTagLength = 5,
      lookaheadText = this.text.substr(0, openingTagLength),
      isValid = lookaheadText.match(/<\?php/i);

    if (isValid) {
      this.phpMeta.push({
        type: 'opening_tag',
        index: this.currentCharIndex,
        length: openingTagLength
      });
      this.text = this.text.substr(openingTagLength);
      this.currentCharIndex += openingTagLength;
    }
    return isValid;
  }

  handleCloseTag() {
    const closingTagLength = 2,
      lookaheadText = this.text.substr(0, closingTagLength),
      isValid = lookaheadText.match(/\?>/i);

    if (isValid) {
      this.phpMeta.push({
        type: 'closing_tag',
        index: this.currentCharIndex,
        length: closingTagLength
      });
      this.text = this.text.substr(closingTagLength);
      this.currentCharIndex += closingTagLength;
    }
    return isValid;
  }

  toHTMLText() {
    return this.formattedHTMLText;
  }

  getPHPMap() {
    return this.phpCache;
  }
}
module.exports = Parse5Parseable;