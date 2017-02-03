'use strict';

const minify = require('html-minifier').minify,
    parse5 = require('parse5'),
    _ = require('lodash'),
    Parse5Parseable = require('./parse5-php-parseable'),
    Parser = require('./parser');

module.exports = (htmlText, options) => {
    let html = minify(htmlText, {
            removeEmptyAttributes: true,
            collapseWhitespace: true,
            caseSensitive: true
        }),
        parse5Parseable = new Parse5Parseable(html),
        opts = _.defaults(options, {
            fragment: true,
            phpCache: parse5Parseable.getPHPMap(),
            useLib: false
        });

    // Server-side
    const document = opts.fragment ? parse5.parseFragment(parse5Parseable.toHTMLText()) : parse5.parse(parse5Parseable.toHTMLText());

    const parser = new Parser(document, opts);
    return parser.parse().then(pug => pug)
};