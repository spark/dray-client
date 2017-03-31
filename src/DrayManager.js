import { DrayJob } from './DrayJob';
import superagent from 'superagent';
import superagentPromise from 'superagent-promise';

/**
 * Main class for managing Dray jobs
 * @module
 */
export class DrayManager {
	/**
	 * DrayManager class constructor.
	 *
	 * @param {String} drayUrl URL for Dray instance
	 * @param {String} redisUrl URL for Redis instance
	 */
	constructor(drayUrl, redisUrl) {
		this._drayUrl = drayUrl;
		this._redisUrl = redisUrl;
		this._agent = superagentPromise(superagent, Promise);
	}

	/**
	 * Instantiate, set parameters and return {DrayJob}
	 *
	 * @param {Object} parameters Parameters to set
	 * @returns {DrayJob} Job ready to execute
	 */
	createJob(parameters) {
		let job = new DrayJob(this);
		job.setParameters(parameters);
		return job;
	}

	/**
	 * List submitted Dray jobs
	 *
	 * @returns {Promise} Resolves into {Array} of jobs
	 */
	listJobs() {
		return this._request('jobs').then((value) => {
			return value.res.body.map((item) => {
				let job = new DrayJob(this, item);
				return job;
			});
		}, this._onRejected);
	}

	/**
	 * Submit the job to Dray
	 *
	 * @param {DrayJob} job Job to submit
	 * @returns {Promise} Resolves to {DrayJob} if success
	 * @private
	 */
	_submitJob(job) {
		return this._request('jobs', 'post', job.toJSON()).then((value) => {
			Object.assign(job, value.res.body);
			return job;
		}, this._onRejected);
	}

	/**
	 * Delete job from Dray
	 *
	 * @param {DrayJob} job Job to delete
	 * @returns {Promise} Resolves with Dray result
	 * @private
	 */
	_deleteJob(job) {
		return this._request(`jobs/${job.id}`, 'del').then((value) => {
			return value.res.body;
		}, this._onRejected);
	}

	/**
	 * Get logs for specified job
	 *
	 * @param {DrayJob} job Job for which to get logs
	 * @returns {Promise} Resolves to and {Array} containing logs
	 * @private
	 */
	_getJobLogs(job) {
		return this._request(`jobs/${job.id}/log`).then((value) => {
			return value.res.body.lines;
		}, this._onRejected);
	}

	/**
	 * Send a request to Dray instance
	 *
	 * @param {String} url URL appended to Dray's URL
	 * @param {String} method (optional) HTTP method, defaults to GET
	 * @param {Mixed}  data (optional) Data to be passed
	 * @returns {Promise} resolved with request response
	 * @private
	 */
	_request(url, method='get', data=undefined) {
		return this._agent[method](`${this._drayUrl}/${url}`, data).end();
	}

	_onRejected(reason) {
		return Promise.reject(reason);
	}
}
