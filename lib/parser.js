'use strict'

const treeAdapter = require('parse5').treeAdapters.default;
const util = require('util');
const _ = require('lodash');

class Parser {
  constructor(root, opts) {
    const _options = _.defaults(opts, {
      tab: '    ',
      newLine: '\n',
      useLib: false,
      phpCache: []
    });

    this.phpCache = opts.phpCache;
    this.tab = _options.tab;
    this.newLine = _options.newLine;
    this.config = {
      useLib: _options.useLib,
      regex: {
        attribute: /<!--\[[0-9]+]-->/,
        comment: /\[[0-9]+]/,
        index: /\[([0-9]+)]/,
      }
    };

    this.root = root;
    this.pug = '';

  }

  parse() {
    return new Promise((resolve, reject) => {
      // var walk = this.walk(this.root.childNodes);
      var walk = this.walk(this.root.childNodes, 0);

      do {
        this.itr = walk.next()
      } while (!this.itr.done);

      resolve(this.pug.substring(1))
    })
  }

  /**
   * DOM tree traversal
   * Depth-first search (pre-order)
   *
   * @param {DOM} tree - DOM tree or Node
   * @param {Number} level - Current tree level
   */
  * walk(tree, level) {
    if (!tree) return;

    for (let i = 0; i < tree.length; i++) {
      const node = tree[i];

      // let pugText = this.parseNode(node);
      let pugText = this.parseNode(node, level);
      if (pugText) this.pug += pugText;

      if (
        node.childNodes &&
        node.childNodes.length > 0 && !this.isUniqueTextNode(node)
      ) {
        this.prevNode = node;
        // yield * this.walk(node.childNodes)
        yield * this.walk(node.childNodes, level + 1)
      }
    }
  }

  parseNode(node, level) {
    // const indentation = '  '.repeat(this.indentationLevel);
    const indentation = this.tab.repeat(level);

    if (treeAdapter.isDocumentTypeNode(node)) return `${indentation}doctype html`;

    if (this.isPHPCommentStub(node)) {
      return this.buildPHPText(node, level);
    } else if (treeAdapter.isTextNode(node)) {
      return (/^\s*$/.test(node.value)) ? '' : `\n${indentation}| ${node.value}`;
    } else if (treeAdapter.isCommentNode(node)) {

      return `${this.newLine}${node.data.split('\n').map(l => `${indentation}//${l}`).join('\n')}`;
    } else if (treeAdapter.isElementNode(node)) {
      let line = `${indentation}${this.setAttributes(node, this.config.attrs)}`;

      if (this.isUniqueTextNode(node))
        line += ` ${node.childNodes[0].value}`;

      return this.newLine + line
    } else {
      return node
    }
  }

  setAttributes(node) {
    let str = node.tagName === 'div' ? '' : node.tagName,
      attributes = [],
      classList = [],
      unsafeClassList = [],
      isPHPAttr = false;

    // Adds #id and .class
    if (node.id) str += `#${node.id}`;

    for (let a = 0; a < node.attrs.length; a++) {
      let attr = node.attrs[a];

      if (this.isPHPAttributeStub(attr)) {
        this.replacePHPAttrStub(attr);
        isPHPAttr = true;
      }
      switch (attr.name) {
        case undefined:
        case 'class':
          // handle unsafe classNames
          _.forEach(attr.value.split(' '), function (className) {
            if (/^[\w\-]+$/.test(className)) {
              classList.push(className);
            } else {
              unsafeClassList.push(className)
            }
          });
          if (unsafeClassList.length > 0) {
            attributes.push(`class!="${unsafeClassList.join(' ')}"`);
          }
          break;
        default:
          let attrText = `${attr.name}${isPHPAttr ? '!=' : '='}"${attr.value}"`;
          if (this.config.useLib) {
            // clean up unnecessary quotes
            attrText = attrText
              .replace(/=""\+\s*/, '=')
              .replace(/\s*\+""$/, '');
          }
          attributes.push(attrText);
          break;
      }
    }
    // handle node without safe classNames
    if (str == '' && classList.length == 0) {
      str = 'div';
    }

    if (classList.length) str += `.${classList.join('.')}`;
    if (attributes.length) str += `(${attributes.join(' ')})`;

    return str
  }

  // Identify Node type
  is(type, node) {
    return (node.nodeName === type)
  }

  isPHPCommentStub(node) {
    return (this.config.regex.comment.test(node.data || node.value))
  }

  isPHPAttributeStub(node) {
    return (this.config.regex.attribute.test(node.data || node.value))
  }

  isUniqueTextNode(node) {
    return node.childNodes.length === 1 && treeAdapter.isTextNode(node.childNodes[0])
  }

  replacePHPAttrStub(attr, options) {

    let phpCacheIndex = parseInt(this.config.regex.index.exec(attr.value)[1]),
      phpText = this.phpCache[phpCacheIndex].text;

    attr.value = attr.value.replace(this.config.regex.attribute, this.config.useLib ? `"+ php("${phpText}")+"` : `<?php ${phpText}?>`);
    return attr;
  }

  buildPHPText(node, level) {
    const indentation = this.tab.repeat(level),
      filterContentIndentation = this.tab.repeat(level + 1),
      phpCacheIndex = parseInt(this.config.regex.index.exec(node.data)[1]),
      phpText = this.phpCache[phpCacheIndex].text,
      filterContentLines = phpText.split('\n'),
      hasMultipleLines = /\n/.test(phpText);

    if (hasMultipleLines) {
      const filterContent = "\n" + filterContentIndentation + filterContentLines.join(`\n${this.tab}`);
      return `\n${indentation}:php${filterContent}`;
    } else {
      const boundingQuote = /"/.test(phpText) ? "'" : "\"";
      if (this.config.useLib) {
        return `!=php(${boundingQuote}${phpText}${boundingQuote})`;
      } else {
        return ` !{${boundingQuote}<?php ${phpText} ?>${boundingQuote}}`;
      }
    }
  }
}

module.exports = Parser;
