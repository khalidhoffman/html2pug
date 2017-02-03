class Parse5Parseable {

    constructor(htmlText) {
        this.htmlText = htmlText;
        this.text = htmlText;
        this.currentCharIndex = 0;
        this.formattedHTMLText = htmlText;
    }

    parse() {
        while (this.text.length > 0) {
            this.consume();
        }
    }

    format() {
        // do something
    }

    /**
     *
     *
     */
    consume() {
        this.advance();
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

    advance(length) {
        const shiftAmount = length || 1;

        this.text = this.text.substr(shiftAmount);
        this.currentCharIndex += shiftAmount;
    }

    toHTMLText() {
        return this.formattedHTMLText;
    }
}

module.exports = Parse5Parseable;