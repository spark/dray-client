'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.BuildpackJob = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

require('babel-polyfill');

var _archiver = require('archiver');

var _archiver2 = _interopRequireDefault(_archiver);

var _redis = require('redis');

var _redis2 = _interopRequireDefault(_redis);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _stream = require('stream');

var _DrayJob2 = require('./DrayJob');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

_bluebird2.default.promisifyAll(_redis2.default.RedisClient.prototype);

var BuildpackJob = exports.BuildpackJob = function (_DrayJob) {
	_inherits(BuildpackJob, _DrayJob);

	function BuildpackJob(manager, parameters) {
		var redisExpireIn = arguments.length <= 2 || arguments[2] === undefined ? 600 : arguments[2];

		_classCallCheck(this, BuildpackJob);

		var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(BuildpackJob).call(this, manager, parameters));

		_this._redisExpireIn = redisExpireIn;
		_this._files = [];
		_this._buildpacks = [];

		if (_this._manager) {
			_this.setEnvironment({
				REDIS_URL: _this._manager._redisUrl,
				REDIS_EXPIRE_IN: _this._redisExpireIn
			});
		}
		return _this;
	}

	_createClass(BuildpackJob, [{
		key: 'addFiles',
		value: function addFiles(files) {
			var _files;

			(_files = this._files).push.apply(_files, _toConsumableArray(files));
			return this;
		}
	}, {
		key: 'setBuildpacks',
		value: function setBuildpacks(buildpacks) {
			this._buildpacks = buildpacks;
			this._buildpacks.push('particle/buildpack-store');
			return this;
		}
	}, {
		key: 'submit',
		value: function submit(timeout) {
			var _this2 = this;

			var _iteratorNormalCompletion = true;
			var _didIteratorError = false;
			var _iteratorError = undefined;

			try {
				for (var _iterator = this._buildpacks[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
					var buildpack = _step.value;

					// We want each buildpack to pass output directory to input of a
					// next one. Setting following envs and output argument does that
					var env = {
						INPUT_FROM_STDIN: true,
						ARCHIVE_OUTPUT: true
					};
					this.addStep(buildpack, env, undefined, '/output.tar.gz');
				}
			} catch (err) {
				_didIteratorError = true;
				_iteratorError = err;
			} finally {
				try {
					if (!_iteratorNormalCompletion && _iterator.return) {
						_iterator.return();
					}
				} finally {
					if (_didIteratorError) {
						throw _iteratorError;
					}
				}
			}

			return new Promise(function (resolve) {
				// If we have files to compile, archive them first
				if (_this2._files.length > 0) {
					return resolve(_this2._archiveFiles().then(function (archive) {
						_this2.setInput(archive);
					}));
				}
				resolve();
			}).then(function () {
				// Submit this as any regular job
				return _get(Object.getPrototypeOf(BuildpackJob.prototype), 'submit', _this2).call(_this2, timeout);
			}).then(function () {
				_this2.destroy();
				// Compilation finished. Any contents of last buildpack's output
				// should be in Redis. Just fetch and return it
				var client = _redis2.default.createClient(_this2._manager._redisUrl);
				return client.hgetallAsync(_this2.id).then(function (value) {
					client.quit();
					return value;
				});
			}, function () {
				return _this2.getLogs().then(function (logs) {
					_this2.destroy();
					// Because successful `getLogs` call resolves instead of rejecting
					// we're returning a rejected promise instead
					return Promise.reject(logs);
				});
			});
		}

		/**
   * Create tar.gz archive from files
   *
   * @returns {Buffer} archived files
   * @private
   */

	}, {
		key: '_archiveFiles',
		value: function _archiveFiles() {
			// Defer promise
			var _resolve = void 0,
			    _reject = void 0;
			var promise = new Promise(function (resolve, reject) {
				_resolve = resolve;
				_reject = reject;
			});
			// Prepare output stream and buffer
			var stream = new _stream.PassThrough();
			var buffer = new Buffer('');
			stream.on('finish', function () {
				_resolve(buffer);
			});
			stream.on('data', function (data) {
				buffer = Buffer.concat([buffer, data]);
			});

			// Initialize archiver
			var archive = (0, _archiver2.default)('tar', { gzip: true });
			archive.on('error', function (err) {
				_reject(err);
			});
			archive.pipe(stream);

			// Append all files
			var _iteratorNormalCompletion2 = true;
			var _didIteratorError2 = false;
			var _iteratorError2 = undefined;

			try {
				for (var _iterator2 = this._files[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
					var file = _step2.value;

					archive.append(file.data, file);
				}
			} catch (err) {
				_didIteratorError2 = true;
				_iteratorError2 = err;
			} finally {
				try {
					if (!_iteratorNormalCompletion2 && _iterator2.return) {
						_iterator2.return();
					}
				} finally {
					if (_didIteratorError2) {
						throw _iteratorError2;
					}
				}
			}

			archive.finalize();
			return promise;
		}
	}]);

	return BuildpackJob;
}(_DrayJob2.DrayJob);
//# sourceMappingURL=BuildpackJob.js.map