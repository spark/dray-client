import 'babel-polyfill';
import { DrayJob } from './DrayJob';

export class DrayManager {
	constructor({drayUrl, redisUrl}) {}

	createJob(parameters) {
		let job = new DrayJob(this);
		job.setParameters(parameters);
		return job;
	}

	listJobs() {
		return Promise.resolve([]);
	}
}
