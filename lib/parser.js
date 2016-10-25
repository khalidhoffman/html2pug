'use strict'

const treeAdapter = require('parse5').treeAdapters.default;
const util = require('util');
const _ = require('lodash');

class Parser {
  constructor(root, opts) {
    var _options = _.defaults(opts, {
      tab: '  '
    });
    this.root = root;
    this.pug = '';
    this.tab = _options.tab;
  }

  parse() {
    return new Promise((yep, nope) => {
      const walk = this.walk(this.root.childNodes, 0);
      let it

      do {
        it = walk.next()
      } while (!it.done);

      yep(this.pug.substring(1))
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

      let pugText = this.parseNode(node, level);
      this.pug += (pugText) ? `\n${pugText}` : '';

      if (
          node.childNodes &&
          node.childNodes.length > 0 && !this.isUniqueTextNode(node)
      ) {
        yield * this.walk(node.childNodes, level + 1)
      }
    }
  }

  parseNode(node, level) {
    const indentation = '  '.repeat(level);

    if (treeAdapter.isDocumentTypeNode(node)) return `${indentation}doctype html`;

    if (treeAdapter.isTextNode(node)) {
      return (/^\s*$/.test(node.value)) ? '' : `${indentation}| ${node.value}`;
    } else if (treeAdapter.isCommentNode(node))
      if (this.isPHPNode(node)) {
        return this.buildPHPText(node, level);
      } else {
        return `${node.data.split('\n').map(l => `${indentation}//${l}`).join('\n')}`;
      }

    else if (treeAdapter.isElementNode(node)) {
      let line = `${indentation}${this.setAttributes(node)}`;

      if (this.isUniqueTextNode(node))
        line += ` ${node.childNodes[0].value}`;

      return line
    }

    else {
      return node
    }
  }

  setAttributes(node) {
    let str = node.tagName === 'div' ? '' : node.tagName;
    let attributes = [];
    let classList = [];
    let unsafeClassList = [];

    // Adds #id and .class
    if (node.id) str += `#${node.id}`;

    for (let a = 0; a < node.attrs.length; a++) {
      const attr = node.attrs[a];

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
              attributes.push(`class="${unsafeClassList.join(' ')}"`);
          }
          break;
        default:
          attributes.push(`${attr.name}="${attr.value}"`);
          break;
      }
    }
    // handle node without safe classNames
    if (str == '' && classList.length == 0) {
      str = 'div';
    }

    if (classList.length) str += `.${classList.join('.')}`;
    if (attributes.length) str += `(${attributes.join(', ')})`;

    return str
  }

  // Identify Node type
  is(type, node) {
    return (node.nodeName === type)
  }

  isPHPNode(node) {
    return (/^\?php/i.test(node.data))
  }

  isUniqueTextNode(node) {
    return node.childNodes.length === 1 && treeAdapter.isTextNode(node.childNodes[0])
  }

  buildPHPText(node, level){
    var indentation = this.tab.repeat(level),
        filterContentIndentation = this.tab.repeat(level + 2),
        filterContentLines = node.data.split('\n').reduce((collection, text) => {
          text = text.replace(/(^\?php\s*)|(^[\n\s]+$)|(\?$)/ig, '');
          if (text) collection.push(`${filterContentIndentation}${text}`);
          return collection;
        }, []),
        filterContent = filterContentLines.join('\n'),
        filter = `${indentation}:php\n`;
    return `${filter}${filterContent}`;
  }
}

module.exports = Parser;
