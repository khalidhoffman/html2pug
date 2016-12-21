# php2pug
PHP/HTML to Pug converter.

Node.js 5.0+ minimum. Uses depth-first search for DOM tree traversal, and ES6 generators.

## Early stages. Very experimental.

## Additions
- Adds support for php code via use of `:php` filters
    + should be used in conjunction with [pug-php-filter](https://github.com/khalidhoffman/pug-php-filter)

```
node lib/cli.js -f /path/to/file.php
```
