'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.DrayManager = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

require('babel-polyfill');

var _DrayJob = require('./DrayJob');

var _superagent = require('superagent');

var _superagent2 = _interopRequireDefault(_superagent);

var _superagentPromise = require('superagent-promise');

var _superagentPromise2 = _interopRequireDefault(_superagentPromise);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DrayManager = exports.DrayManager = function () {
	function DrayManager(drayUrl, redisUrl) {
		_classCallCheck(this, DrayManager);

		this._drayUrl = drayUrl;
		this._redisUrl = redisUrl;
		this._agent = (0, _superagentPromise2.default)(_superagent2.default, Promise);
	}

	_createClass(DrayManager, [{
		key: 'createJob',
		value: function createJob(parameters) {
			var job = new _DrayJob.DrayJob(this);
			job.setParameters(parameters);
			return job;
		}
	}, {
		key: 'submitJob',
		value: function submitJob(job) {
			return this._request('jobs', 'post', job.toJSON()).then(function (value) {
				Object.assign(job, value.res.body);
				return job;
			});
		}
	}, {
		key: 'deleteJob',
		value: function deleteJob(job) {
			return this._request('jobs/' + job.id, 'del').then(function (value) {
				return value.res.body;
			});
		}
	}, {
		key: 'getJobLogs',
		value: function getJobLogs(job) {
			return this._request('jobs/' + job.id + '/log').then(function (value) {
				return value.res.body.lines;
			});
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