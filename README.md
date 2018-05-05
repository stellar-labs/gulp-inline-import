# gulp-inline-import

Inline any ES6 import by fetching its resource down to the importing file.

from

```javascript
import './func1.js';

var func2 = function() {
  func1();
}

export default func2;
```

to

```javascript
var func1 = function() {
  // ...
}

var func2 = function() {
  func1();
}

export default func2;
```

## Summary

- [Installation](#installation)
- [Examples of uses](#examples-of-uses)
- [Options](#options)

## Installation

On your node.js root project folder:

```bash
npm install --save-dev gulp-inline-import
```
Or

```bash
yarn install --save-dev gulp-inline-import
```

**Optionnal**

Quick full installation

```bash
npm install --save-dev gulp gulp-cli gulp-inline-import
```

Or

```bash
yarn install --dev gulp gulp-cli gulp-inline-import
```

## Examples of uses

- [Example 1: including unnamed imports](#example-1-including-unnamed-imports)

### Example 1: including unnamed imports

cate.js:

```javascript
import './cry.js';
import './walk.js';

var cate = function() {
  cry();
  walk();

  console.log('because I am a catto');
};

export default cate;
```

cry.js

```javascript
var cry = function() {
  console.log('meow >_<');
};

export default cry;
```

walk.js

```javascript
var walk = function() {
  console.log('Oh is that your keyboard? Let me show you something... Zzz...');
};

export default walk;
```

gulpfile.js

```javascript
const gulp = require('gulp');
const inlineImport = require('gulp-inline-import');

gulp.task('inline', function() {
  return gulp.src('./src/*.js')
    .pipe( inlineImport() )
    .pipe( gulp.dest('./src') );
});
```

Output of cate.js

```javascript
var cry = function() {
  console.log('meow >_<');
};

var walk = function() {
  console.log('Oh is that your keyboard? Let me show you something... Zzz...');
};

var cate = function() {
  cry();
  walk();

  console.log('because I am a catto');
};

export default cate;
```

**Note**

Node packages exists to remove the export statement, like the babel plugin [babel-plugin-transform-remove-export
](https://www.npmjs.com/package/babel-plugin-transform-remove-export).

## Options

| option                      | type    | required | default | possible values | description                                                                                                            |
|-----------------------------|---------|----------|---------|-----------------|------------------------------------------------------------------------------------------------------------------------|
| verbose                     | Boolean | no       | false   | true,false      | Enable step by step in-console debug information                                                                       |
| maxDepth                    | Integer | no       | 3       |                 | Number of times the plugin should go deep inside nested import statements. This prevent circular imports for instance. |
| allowImportExportEverywhere | Boolean | no       | false   | true,false      | Let you use import and export statements in the middle of your code instead of strictly at the top or bottom.          |