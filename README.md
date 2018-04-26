# gulp-inline-import

Inline any ES6 import by fetching its resource down to the importing file.

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
npm install --dev gulp gulp-cli gulp-inline-import
```

Or

```bash
yarn install --dev gulp gulp-cli gulp-inline-import
```

## Examples of uses

- [Example 1: simple import removal](#example-1-simple-import-removal)

### Example 1: simple import removal

cate.js:

```javascript
import cry from './cry.js';
import walk from './walk.js';

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

```
const gulp = require('gulp');
const inlineImport = require('gulp-inline-import');

gulp.task('inline', function() {
	return gulp.src('./src/*.js')
		.pipe( inlineImport() )
		.pipe( gulp.dest('./src') );
});
```

## Options

| option   | type    | required | default | possible values | description                                                                                                            |
|----------|---------|----------|---------|-----------------|------------------------------------------------------------------------------------------------------------------------|
| verbose  | Boolean | no       | false   | true,false      | Enable step by step in-console debug information                                                                       |
| maxDepth | Integer | no       | 3       |                 | Number of times the plugin should go deep inside nested import statements. This prevent circular imports for instance. |