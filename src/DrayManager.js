import 'babel-polyfill';
import { DrayJob } from './DrayJob';
import superagent from 'superagent';
import superagentPromise from 'superagent-promise';

export class DrayManager {
	constructor(drayUrl, redisUrl) {
		this._drayUrl = drayUrl;
		this._redisUrl = redisUrl;
		this._agent = superagentPromise(superagent, Promise);
	}

	createJob(parameters) {
		let job = new DrayJob(this);
		job.setParameters(parameters);
		return job;
	}

	submitJob(job) {
		return this._request('jobs', 'post', job.toJSON()).then((value) => {
			Object.assign(job, value.res.body);
			return job;
		});
	}

	deleteJob(job) {
		return this._request(`jobs/${job.id}`, 'del').then((value) => {
			return value.res.body;
		});
	}

	getJobLogs(job) {
		return this._request(`jobs/${job.id}/log`).then((value) => {
			return value.res.body.lines;
		});
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
		});
	}

	_request(url, method='get', data=undefined) {
		return this._agent[method](`${this._drayUrl}/${url}`, data).end();
	}
}
