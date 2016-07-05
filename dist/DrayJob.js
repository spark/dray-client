'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.DrayJob = undefined;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

require('babel-polyfill');

var _events = require('events');

var _redis = require('redis');

var _redis2 = _interopRequireDefault(_redis);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var DrayJob = exports.DrayJob = function (_EventEmitter) {
	_inherits(DrayJob, _EventEmitter);

	function DrayJob(manager, parameters) {
		_classCallCheck(this, DrayJob);

		var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(DrayJob).call(this));

		_this._manager = manager;
		_this._steps = [];
		_this._environment = {};
		_this.setParameters(parameters);

		_this.on('statusChanged', _this._statusChanged.bind(_this));
		return _this;
	}

	/**
  * Number of steps already completed
  *
  * @returns {Number}    number of completed steps
  * @returns {undefined} if first step hasn't finished yet
  */


	_createClass(DrayJob, [{
		key: 'setParameters',


		/**
   * Set job parameters from passed object
   *
   * @param {Object} parameters One of the following: name, environment, input
   * @returns {this} this object
   */
		value: function setParameters(parameters) {
			Object.assign(this, parameters);
			return this;
		}

		/**
   * Set job environment shared between steps
   *
   * @param {Object} env Object of environment variables
   * @returns {this} this object
   */

	}, {
		key: 'setEnvironment',
		value: function setEnvironment(env) {
			Object.assign(this._environment, env);
			return this;
		}
	}, {
		key: 'setInput',
		value: function setInput(input) {
			this._input = input;
			return this;
		}

		/**
   * Add a single job step
   *
   * @param {String} source Docker image to be run
   * @param {Object} environment (optional) Object containing environment variables for this step
   * @param {String} name (optional) Name of the step
   * @param {String} output (optional) Output channel to be captured
   * @param {Boolean} refresh (optional) If true, image will be pulled before
   * @returns {this} this object
   */

	}, {
		key: 'addStep',
		value: function addStep(source, environment, name, output, refresh) {
			this._steps.push({ source: source, environment: environment, name: name, output: output, refresh: refresh });
			return this;
		}

		/**
   * Submit job for execution
   *
   * @param {Object} timeout (optional) Timeout in ms
   * @returns {Promise} Resolved when job succeeds and rejected if fails
   */

	}, {
		key: 'submit',
		value: function submit(timeout) {
			var _this2 = this;

			// Prepare submission promise
			this._promise = new Promise(function (resolve, reject) {
				_this2._resolve = resolve;
				_this2._reject = reject;
			});
			// Connect to Redis
			this._subscription = _redis2.default.createClient(this._manager._redisUrl);
			// Hook onMessage handler
			this._subscription.on('pmessage', this._onMessage.bind(this));

			// Submit the job...
			this._manager.submitJob(this).then(function () {
				// ...and once we know its ID, we can listen for change events
				_this2._subscription.psubscribe(_this2.id + ':*');
			});

			// If job timeout is specified
			if (timeout) {
				this._timout = setTimeout(function () {
					// Fail the job when timeout reached
					_this2._onJobFailed('Job has timed out');
				}, timeout);
			}

			return this._promise;
		}

		/**
   * Destroy job in Dray
   *
   * @returns {Promise} Resolved once job is destroyed
   */

	}, {
		key: 'destroy',
		value: function destroy() {
			this._cleanup();
			return this._manager.deleteJob(this);
		}

		/**
   * Get array of job logs
   *
   * @returns {Promise} promise resolved with {Array} of logs
   */

	}, {
		key: 'getLogs',
		value: function getLogs() {
			return this._manager.getJobLogs(this);
		}

		/**
   * Serialize job to Dray format
   *
   * @returns {String} Job JSON
   */

	}, {
		key: 'toJSON',
		value: function toJSON() {
			var _this3 = this;

			var output = {
				steps: this._steps.map(function (item) {
					// Convert environment object to Dray format
					if (item.environment && Object.keys(item.environment).length > 0) {
						item.environment = _this3._mapEnvironment(item.environment);
					}
					return item;
				})
			};

			if (this.name) {
				output.name = this.name;
			}

			// Convert environment object to Dray format
			if (Object.keys(this._environment).length > 0) {
				output.environment = this._mapEnvironment(this._environment);
			}

			// Serialize input to base64
			if (this._input) {
				output.input = new Buffer(this._input).toString('base64');
			}
			return JSON.stringify(output);
		}

		/**
   * Redis message handler
   *
   * @param {String} channel Channel name
   * @param {String} message Message contents
   * @param {String} data    Additional data
   * @returns {undefined}
   * @private
   */

	}, {
		key: '_onMessage',
		value: function _onMessage(channel, message, data) {
			// Message is in "ID:property" format

			var _message$split = message.split(':');

			var _message$split2 = _slicedToArray(_message$split, 2);

			var _ = _message$split2[0];
			var property = _message$split2[1];

			this.emit(property + 'Changed', data);
		}
	}, {
		key: '_onJobCompleted',
		value: function _onJobCompleted(value) {
			this._resolve(value);
			this._cleanup();
		}
	}, {
		key: '_onJobFailed',
		value: function _onJobFailed(reason) {
			this._reject(reason);
			this._cleanup();
		}
	}, {
		key: '_statusChanged',
		value: function _statusChanged(newStatus) {
			this._status = newStatus;
			if (this._status === 'complete') {
				this._onJobCompleted();
			} else if (this._status === 'error') {
				this._onJobFailed();
			}
		}
	}, {
		key: '_cleanup',
		value: function _cleanup() {
			if (this._timeout) {
				clearTimeout(this._timeout);
			}
			if (this._subscription) {
				this._subscription.unsubscribe();
				this._subscription.quit();
				this._subscription = undefined;
			}
		}
	}, {
		key: '_mapEnvironment',
		value: function _mapEnvironment(env) {
			return Object.keys(env).map(function (key) {
				return { variable: key, value: env[key].toString() };
			});
		}
	}, {
		key: 'stepsCompleted',
		get: function get() {
			return this._stepsCompleted;
		}

		/**
   * Job status
   *
   * @returns {String} 'running'|'error'|'complete'
   */

	}, {
		key: 'status',
		get: function get() {
			return this._status;
		}

		/**
   * Job creation date
   *
   * @returns {Date} creation date
   */

	}, {
		key: 'createdAt',
		get: function get() {
			return this._createdAt;
		}

		/**
   * Job finish date.
   *
   * @returns {Date}      job finish date
   * @returns {undefined} if job is still running
   */

	}, {
		key: 'finishedIn',
		get: function get() {
			return this._finishedIn;
		}
	}]);

	return DrayJob;
}(_events.EventEmitter);
//# sourceMappingURL=DrayJob.js.map