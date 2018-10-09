const gulp = require('gulp');
const through = require('through2');
const pluginError = require('plugin-error');
const typeOf = require('type-of');
const fancyLog = require('fancy-log');
const babylon = require('babylon');

const fs = require('fs');
const path = require('path');

const PLUGIN_NAME = 'gulp-inline-import';

/**
 * Checks wether the scoped option is a boolean
 * 
 * @param {object} options
 * @param {string} key
 * @throws {Error}
 */
function checkOptionIsBoolean(options, key) {
    if( key in options === true && typeOf(options[key]) !== 'boolean' ) {
        fancyLog.error(PLUGIN_NAME + ': option "' + key + '" should be a boolean, ' + typeOf(options[key]) + ' given');

        return;
    }
}

/**
 * Checks wether the scoped option is an integer
 * 
 * @param {object} options
 * @param {string} key
 * @throws {Error}
 */
function checkOptionIsInteger(options, key) {
    if( key in options === true && typeOf(options[key] !== 'integer') ) {
        fancyLog.error(PLUGIN_NAME + ': option "' + options[key] + '" should be an integer, ' + typeOf(options[key]) + ' given');

        return;
    }
}

/**
 * Check wether all options are valid
 * 
 * @param {object} options
 * @throws {Error}
 */
function checkOptions(options = {}) {
    checkOptionIsBoolean(options, 'verbose');
    checkOptionIsInteger(options, 'maxDepth');
    checkOptionIsBoolean(options, 'allowImportExportEverywhere');    
}

/**
 * Fill the scoped option by a given value
 * 
 * @param {Object} options 
 * @param {string} key 
 * @param {*} value 
 * @returns {Object}
 */
function fillOptionByValue(options, key, value) {
    options[key] = value;

    return options;
}

/**
 * Fill the non specified option by a default value
 * 
 * @param {Object} options 
 * @returns {Object}
 */
function fillMissingOptions(options = {}) {
    let filled_options = options;

    if( 'verbose' in filled_options === false ) {
        filled_options = fillOptionByValue(filled_options, 'verbose', false);
    }

    if( 'maxDepth' in filled_options === false ) {
        filled_options = fillOptionByValue(filled_options, 'maxDepth', 3);
    }

    if( 'allowImportExportEverywhere' in filled_options === false ) {
        filled_options = fillOptionByValue(filled_options, 'allowImportExportEverywhere', false);
    }

    return filled_options;
}

/**
 * 
 * @param {string} path
 * @throws {Error} 
 * @returns {string}
 */
function getFileContent(path) {
    try {
        return fs.readFileSync(path).toString();
    }
    catch( error ) {
        fancyLog.error(PLUGIN_NAME + ': could not get the content of "' + path + '"');

        return '';
    }
}

/**
 * 
 * @param {Object} part 
 * @return {Object}
 */
function importsCaracteristics(parts) {
    let imports = [];
    
    for(part of parts) {
        if( part.type === 'ImportDeclaration' ) {
            imports.push(part);
        }
    }

    return imports;
}

/**
 * Returns an array of object representing the import statements
 * 
 * @param {string} file_path
 * @param {object} options 
 * @returns {Array}
 */
function fetchImports(file_path, options) {
	const content = getFileContent(file_path);

    const parsed_content = babylon.parse(content, {
        sourceType: 'module',
        allowImportExportEverywhere: options.allowImportExportEverywhere
    });

    var imports = [];

    if( parsed_content.type !== 'File' ) {
        fancyLog.error(PLUGIN_NAME + ': "' + file_path + '" is not a file (it is a ' + parsed_content.type + ', which is not supported), cannot find imports statements inside of it');

        return imports;
    }

    if(parsed_content.program.type !== 'Program') {
        fancyLog.error(PLUGIN_NAME + ': "' + file_path + '" is not a program (it is a ' + parsed_content.program.type + ', which is not supported)');

        return imports;
    }

    imports = importsCaracteristics(parsed_content.program.body);    

    return imports;
}

/**
 * Return true if the import is unnamed (import './cate.js';)
 * 
 * @param {Object} part 
 * @returns {boolean}
 */
function importIsUnnamed(part) {
    return part.specifiers.length === 0;
}

/**
 * Returns the file path from an import part object
 * 
 * @param {Object} part 
 * @returns {string}
 */
function importFilePath(part) {
    return part.source.value;
}

/**
 * Return the file_path without the base path
 * 
 * @param {stirng} base_path 
 * @param {string} file_path 
 * @returns {string}
 */
function relativeFileName(base_path, file_path) {
	return file_path.replace(base_path, '');
}

/**
 * Inline the imports by recursively fetching the imports statements
 * 
 * @param {string} base_path
 * @param {string} file_path
 * @param {string} options 
 * @returns {string}
 */
function inlineImports(base_path, file_path, options) {
    let content = getFileContent(file_path);    
    let decay = 0;
    const imports = fetchImports(file_path, options);    

    if( imports.length > 0 ) {
        for( let importation of imports ) {
            if( importIsUnnamed(importation) === true ) {
                if( options.verbose === true ) {
					fancyLog.info(PLUGIN_NAME + ': unnamed import detected on file ' + relativeFileName(base_path, file_path));
					fancyLog.info(PLUGIN_NAME + ': this unnamed import points to the file ', relativeFileName(base_path, importFilePath(importation)));
                }

                const file_sub_content = inlineImports(base_path, importFilePath(importation), options );

                content = content.substring(0, (importation.start + decay)) + file_sub_content + content.substring(importation.end + decay);

				decay = (file_sub_content.length - (importation.end - importation.start)) - decay;
            }
            else {
                if( options.verbose === true ) {
                    fancyLog.warn(PLUGIN_NAME + ': import with specifier is not supported yet');
                }
            }
        }

        return content;
    }
    else {
		if( options.verbose === true ) {
			fancyLog.info(PLUGIN_NAME + ': no imports to inline on file ' + relativeFileName(base_path, file_path));
		}

        return content;
    }
}

/**
 * Gulp plugin to inline import from other files.
 * It avoid having some code that relate to ES6 import system, like the output generated by Browserify.
 */ 
function gulpInlineImport(options = {}) {
	checkOptions();
	options = fillMissingOptions(options);

	return through.obj(function(file, encryption, callback) {
		if(file.isNull() === true || file.isStream() === true) {
			return callback(error = null, file);
		}

		const file_path = file.path;
		const base_path = path.dirname(file_path);

		fancyLog.info(PLUGIN_NAME + ': starting to inline imports in file ' + file.relative);

		const inlined_file_content = inlineImports(base_path, file_path, options);

		file.contents = new Buffer(inlined_file_content);
		
		fancyLog.info(PLUGIN_NAME + ': file ' + file.relative + ' inlined');

		callback(error = null, file);
	});
}

module.exports = gulpInlineImport;