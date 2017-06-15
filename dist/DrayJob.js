'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.DrayJob = undefined;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _events = require('events');

var _redis = require('redis');

var _redis2 = _interopRequireDefault(_redis);

var _TimeoutError = require('./TimeoutError');

var _TimeoutError2 = _interopRequireDefault(_TimeoutError);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /*eslint-disable curly */


/**
 * Generic Dray job class
 * @module
 */
var DrayJob = exports.DrayJob = function (_EventEmitter) {
	_inherits(DrayJob, _EventEmitter);

	/**
  * DrayJob class constructor.
  *
  * @param {DrayManager} manager {DrayManager} instance
  * @param {Object} parameters Parameters to set
  */
	function DrayJob(manager, parameters) {
		_classCallCheck(this, DrayJob);

		var _this = _possibleConstructorReturn(this, (DrayJob.__proto__ || Object.getPrototypeOf(DrayJob)).call(this));

		_this._manager = manager;
		_this._steps = [];
		_this._environment = {};
		_this._profiler = [];
		_this.setParameters(parameters);

		_this.on('statusChanged', _this._statusChanged.bind(_this));
		_this.on('completedStepsChanged', _this._stepCompleted.bind(_this));
		return _this;
	}

	/**
  * Number of steps already completed
  *
  * @returns {Number}    Number of completed steps
  * @returns {undefined} If first step hasn't finished yet
  */


	_createClass(DrayJob, [{
		key: 'setParameters',


		/**
   * Set job parameters from passed object
   *
   * @param {Object} parameters One of the following: name, input
   * @returns {this} `this` object
   */
		value: function setParameters(parameters) {
			Object.assign(this, parameters);
			return this;
		}

		/**
   * Set job environment shared between steps
   *
   * @param {Object} env Object of environment variables
   * @returns {this} `this` object
   */

	}, {
		key: 'setEnvironment',
		value: function setEnvironment(env) {
			Object.assign(this._environment, env);
			return this;
		}

		/**
   * Set job input data
   *
   * @param {Mixed} input Input to be sent
   * @returns {this} `this` object
   */

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
   * @param {String} networkMode (optional) Network mode for this container
   * @param {Number} cpuShares (optional) Container's CPU shares
   * @param {Number} memory (optional) Memory limit in bytes
   * @param {Number} timeout (optional) Step timeout in seconds
   * @returns {this} this object
   */

	}, {
		key: 'addStep',
		value: function addStep(source, environment, name, output, refresh, networkMode, cpuShares, memory, timeout) {
			var step = { source: source, environment: environment, name: name, output: output, refresh: refresh };
			if (networkMode) step.networkMode = networkMode;
			if (cpuShares) step.cpuShares = cpuShares;
			if (memory) step.memory = memory;
			if (timeout) step.timeout = timeout;

			this._steps.push(step);
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
			this._subscription = this._createRedisClient(this._manager._redisUrl);
			// Hook onMessage handler
			this._subscription.on('pmessage', this._onMessage.bind(this));
			this._subscription.on('error', function (error) {
				_this2._onJobFailed(error);
			});

			// Submit the job...
			this._manager._submitJob(this).then(function () {
				_this2._lastTiming = Date.now();
				// ...and once we know its ID, we can listen for change events
				_this2._subscription.psubscribe(_this2.id + ':*');
			}, function (reason) {
				_this2._onJobFailed(reason);
			});

			// If job timeout is specified
			if (timeout) {
				this._timout = setTimeout(function () {
					// Fail the job when timeout reached
					_this2._onJobFailed(new _TimeoutError2.default('Job has timed out'));
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
			return this._manager._deleteJob(this);
		}

		/**
   * Get array of job logs
   *
   * @returns {Promise} promise resolved with {Array} of logs
   */

	}, {
		key: 'getLogs',
		value: function getLogs() {
			return this._manager._getJobLogs(this);
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
			var _message$split = message.split(':'),
			    _message$split2 = _slicedToArray(_message$split, 2),
			    _ = _message$split2[0],
			    property = _message$split2[1];

			this.emit(property + 'Changed', data);
		}

		/**
   * Callback for a job status changing to "complete"
   *
   * @param {Mixed} value Value to resolve the promise with
   * @returns {undefined}
   * @private
   */

	}, {
		key: '_onJobCompleted',
		value: function _onJobCompleted(value) {
			this._resolve(value);
			this._cleanup();
		}

		/**
   * Callback for a job status changing to "error"
   *
   * @param {Mixed} reason Reason to reject the promise with
   * @returns {undefined}
   * @private
   */

	}, {
		key: '_onJobFailed',
		value: function _onJobFailed(reason) {
			// Add last profiling frame
			this._addProfilerFrame(this._stepsCompleted, 'error');

			this._reject(reason);
			this._cleanup();
		}

		/**
   * Callback for a job status changing
   *
   * @param {String} newStatus New job status
   * @returns {undefined}
   * @private
   */

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

		/**
   * Callback for a job step completed
   *
   * @param {String} index One based step index
   * @returns {undefined}
   * @private
   */

	}, {
		key: '_stepCompleted',
		value: function _stepCompleted(index) {
			this._stepsCompleted = index;
			this._addProfilerFrame(this._stepsCompleted - 1);
		}

		/**
   * Cleaning up function. Removes timeout and closes
   * Redis connection.
   *
   * @returns {undefined}
   * @private
   */

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

		/**
   * Turn {Object} into env {Array} accepted by Dray.
   *
   * @param {Object} env Environment object
   * @returns {Array} Array accepted by Dray
   * @private
   */

	}, {
		key: '_mapEnvironment',
		value: function _mapEnvironment(env) {
			return Object.keys(env).map(function (key) {
				return { variable: key, value: env[key].toString() };
			});
		}

		/**
   * Create an instance of Redis Client
   *
   * @param {String} redisUrl Redis URL
   * @returns {Redis} Redis Client instance
   * @private
   */

	}, {
		key: '_createRedisClient',
		value: function _createRedisClient(redisUrl) {
			return _redis2.default.createClient(redisUrl);
		}

		/**
   * Creates a timing data frame in internal profiler
   *
   * @param {Number} index  Step index
   * @param {String} status Status of the step
   * @returns {undefined}
   * @private
   */

	}, {
		key: '_addProfilerFrame',
		value: function _addProfilerFrame(index) {
			var status = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'complete';

			this._profiler.push({
				step: this._steps[index],
				elapsed: Date.now() - this._lastTiming,
				status: status
			});
			this._lastTiming = Date.now();
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
   * @returns {Date} Job creation date
   */

	}, {
		key: 'createdAt',
		get: function get() {
			return this._createdAt;
		}

		/**
   * Job finish date.
   *
   * @returns {Date}      Job finish date
   * @returns {undefined} If job is still running
   */

	}, {
		key: 'finishedIn',
		get: function get() {
			return this._finishedIn;
		}

		/**
   * Job profile data
   *
   * @returns {Array} List of steps and their timings
   */

	}, {
		key: 'profiler',
		get: function get() {
			return this._profiler;
		}
	}]);

	return DrayJob;
}(_events.EventEmitter);
//# sourceMappingURL=DrayJob.js.map