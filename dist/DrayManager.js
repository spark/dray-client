'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.DrayManager = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _DrayJob = require('./DrayJob');

var _superagent = require('superagent');

var _superagent2 = _interopRequireDefault(_superagent);

var _superagentPromise = require('superagent-promise');

var _superagentPromise2 = _interopRequireDefault(_superagentPromise);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DrayManager = exports.DrayManager = function () {
	/**
  * DrayManager class constructor.
  *
  * @param {String} drayUrl URL for Dray instance
  * @param {String} redisUrl URL for Redis instance
  */

	function DrayManager(drayUrl, redisUrl) {
		_classCallCheck(this, DrayManager);

		this._drayUrl = drayUrl;
		this._redisUrl = redisUrl;
		this._agent = (0, _superagentPromise2.default)(_superagent2.default, Promise);
	}

	/**
  * Instantiate, set parameters and return {DrayJob}
  *
  * @param {Object} parameters Parameters to set
  * @returns {DrayJob} Job ready to execute
  */


	_createClass(DrayManager, [{
		key: 'createJob',
		value: function createJob(parameters) {
			var job = new _DrayJob.DrayJob(this);
			job.setParameters(parameters);
			return job;
		}

		/**
   * List submitted Dray jobs
   *
   * @returns {Promise} Resolves into {Array} of jobs
   */

	}, {
		key: 'listJobs',
		value: function listJobs() {
			var _this = this;

			return this._request('jobs').then(function (value) {
				return value.res.body.map(function (item) {
					var job = new _DrayJob.DrayJob(_this, item);
					return job;
				});
			});
		}

		/**
   * Submit the job to Dray
   *
   * @param {DrayJob} job Job to submit
   * @returns {Promise} Resolves to {DrayJob} if success
   */

	}, {
		key: '_submitJob',
		value: function _submitJob(job) {
			return this._request('jobs', 'post', job.toJSON()).then(function (value) {
				Object.assign(job, value.res.body);
				return job;
			});
		}

		/**
   * Delete job from Dray
   *
   * @param {DrayJob} job Job to delete
   * @returns {Promise} Resolves with Dray result
   */

	}, {
		key: '_deleteJob',
		value: function _deleteJob(job) {
			return this._request('jobs/' + job.id, 'del').then(function (value) {
				return value.res.body;
			});
		}

		/**
   * Get logs for specified job
   *
   * @param {DrayJob} job Job for which to get logs
   * @returns {Promise} Resolves to and {Array} containing logs
   */

	}, {
		key: '_getJobLogs',
		value: function _getJobLogs(job) {
			return this._request('jobs/' + job.id + '/log').then(function (value) {
				return value.res.body.lines;
			});
		}

		/**
   * Send a request to Dray instance
   *
   * @param {String} url URL appended to Dray's URL
   * @param {String} method (optional) HTTP method, defaults to GET
   * @param {Mixed}  data (optional) Data to be passed
   * @returns {Promise} resolved with request response
   */

	}, {
		key: '_request',
		value: function _request(url) {
			var method = arguments.length <= 1 || arguments[1] === undefined ? 'get' : arguments[1];
			var data = arguments.length <= 2 || arguments[2] === undefined ? undefined : arguments[2];

			return this._agent[method](this._drayUrl + '/' + url, data).end();
		}
	}]);

	return DrayManager;
}();
//# sourceMappingURL=DrayManager.js.map