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
		return this._request('jobs', {post: job.toJSON()}, 'post').then((value) => {
			Object.assign(job, value.res.body);
			return job;
		});
	}

	deleteJob(job) {
		return this._request(`jobs/${job.id}`, null, 'del').then((value) => {
			return value.res.body;
		});
	}

	listJobs() {
		return this._request('jobs').then((value) => {
			return value.res.body.map((item) => {
				let job = new DrayJob(this, item);
				return job;
			});
		});
	}

	_request(url, data={}, method='get') {
		return this._agent[method](`${this._drayUrl}/${url}`, data).end();
	}
}
