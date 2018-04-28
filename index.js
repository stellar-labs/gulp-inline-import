const gulp = require('gulp');
const through = require('through2');
const pluginError = require('plugin-error');
const typeOf = require('type-of');

const fs = require('fs');
const path = require('path');

const PLUGIN_NAME = 'gulp-inline-import';
const DEFAULT_MAX_ROUNDS = 3;
const DEFAULT_VERBOSE_STATE = false;

/**
 * Recursively fetch the import, so that nested imported are resolved as well
 * 
 * @param content String
 * @param encryption String
 * @param regexp RegExp
 * @return String
 */
function traverse(content, file_path, encryption, catch_import_statements, catch_export_statements, current_depth, max_depth) {
	let copy = content;
	let matches = catch_import_statements.exec(copy);

	if(matches === null || current_depth > max_depth) {
		return copy;
	}
	else {
		let import_path = '';
		let file_content = '';
		let full_path = '';

		while( matches !== null ) {
			import_path = matches[1];
			match = matches[0];
			full_path = file_path + '/' + import_path;

			file_content = fs.readFileSync(full_path, encryption, mode = 'r');

			file_content = file_content.replace(catch_export_statements, '');

			copy = copy.replace(match, file_content);

			matches = catch_import_statements.exec(copy);
		}

		current_depth++;

		return traverse(copy, file_path, encryption, catch_import_statements, catch_export_statements, current_depth);
	}
}

/**
 * Gulp plugin to inline import from other files.
 * It avoid having some code that relate to ES6 import system, like the output generated by Browserify.
 */ 
function inlineImport(options = { verbose: DEFAULT_VERBOSE_STATE, maxDepth: DEFAULT_MAX_ROUNDS }) {
	if(options !== undefined && ('verbose' in options) === true && typeOf(options.verbose) !== 'boolean') {
		throw new pluginError(PLUGIN_NAME, 'option verbose should be a boolean, ' + typeOf(options.verbose) + ' given');
	}

	if(options !== undefined && ('maxDepth' in options) === true && typeOf(options.maxDepth) !== 'number')  {
		throw new pluginError(PLUGIN_NAME, 'option maxDepth should be an integer, ' + typeOf(options.maxDepth) + ' given');
	}

	if(options !== undefined && ('verbose' in options) === false) {
		options.verbose = DEFAULT_VERBOSE_STATE;
	}

	if(options !== undefined && ('maxDepth' in options) === false) {
		options.maxDepth = DEFAULT_MAX_ROUNDS;
	}

	const catch_import_statements_2 = /import[\s]+[\w]+[\s]+from[\s]+["'][\w-_]+\.js["'][\s]*[;]/g; // import exportParDefaut from "nom-module.js";
	const catch_import_statements_1 = /(?:import[\s]+["'])([\w-_.\/]+)(?:["'][;]*)/g; // import "./cate.js";
	const catch_export_statements = /export\s+default\s+.*(;|\Z)/g;

	return through.obj(function(file, encryption, callback) {
		if(file.isNull() === true || file.isStream() === true) {
			return callback(error = null, file);
		}

		const FILE_PATH = path.dirname(file.path);
		const max_rounds = options.maxDepth;

		let file_content = new Buffer(file.contents).toString();
		let current_depth = 0;
		let inlined_file_content = traverse(file_content, FILE_PATH, encryption, catch_import_statements_1, catch_export_statements, current_depth, options.maxDepth);

		file.contents = new Buffer(inlined_file_content);

		callback(error = null, file);
	});
}

module.exports = inlineImport;