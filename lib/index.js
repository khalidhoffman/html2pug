const minify = require('html-minifier').minify;
const parse5 = require('parse5');
const _ = require('lodash');

const Parse5Parseable = require('./parse5-php-parseable');
const Parser = require('./parser');

const minifyParams = {
    removeEmptyAttributes: true,
    collapseWhitespace: true,
    caseSensitive: true
};

module.exports = function (htmlText, options) {
    const parserDefaults = {
        fragment: true,
        useLib: false
    };
    const opts = _.defaults(options, parserDefaults);
    const html = minify(htmlText, minifyParams);
    const parse5Parseable = new Parse5Parseable(html);
    const document = opts.fragment ? parse5.parseFragment(parse5Parseable.toHTMLText()) : parse5.parse(parse5Parseable.toHTMLText());
    const parser = new Parser(document, Object.assign(opts, {phpMap: parse5Parseable.getPHPMap()}));

    return parser.parse();
};