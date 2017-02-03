const _ = require('lodash'),
      Parse5Parseable = require('./parse5-parseable');

class Parse5PHPParseable extends Parse5Parseable {

    constructor() {
        super(...arguments);
        this.openingTagLength= 5;
        this.closingTagLength = 2;
        this.phpMeta = [];
        this.phpCache = [];
        this.parse();
        this.format();
    }

    consume() {
        if (!(this.hasOpenTag() || this.hasCloseTag())) {
            this.advance();
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

    hasOpenTag() {
        const lookaheadText = this.text.substr(0, this.openingTagLength),
              isValid = lookaheadText.match(/<\?php/i);

        if (isValid) this.onOpenTag();

        return isValid;
    }

    onOpenTag() {
        this.phpMeta.push({
            type: 'opening_tag',
            index: this.currentCharIndex,
            length: this.openingTagLength
        });

        this.advance(this.openingTagLength);
    }

    hasCloseTag() {
        const lookaheadText = this.text.substr(0, this.closingTagLength),
            isValid = lookaheadText.match(/\?>/i);

        if (isValid) this.onCloseTag();

        return isValid;
    }

    onCloseTag() {
        this.phpMeta.push({
            type: 'closing_tag',
            index: this.currentCharIndex,
            length: this.closingTagLength
        });

        this.advance(this.closingTagLength);
    }

    getPHPMap() {
        return this.phpCache;
    }
}

module.exports = Parse5PHPParseable;
