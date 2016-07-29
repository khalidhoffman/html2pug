'use strict'

const minify = require('html-minifier').minify;
const parse5 = require('parse5');
const _ = require('lodash');
const Parser = require('./parser');

module.exports = (html, opts) => {
  opts = _.extend({fragment: true}, opts);

  html = minify(html, {
    removeEmptyAttributes: true,
    collapseWhitespace: true,
    caseSensitive: true
  })

  // Server-side
  const document = opts.fragment ? parse5.parseFragment(html) : parse5.parse(html)

  const parser = new Parser(document, opts);
  return parser.parse().then(pug => pug)
}
