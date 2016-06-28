import 'babel-polyfill';
import { EventEmitter } from 'events';
import redis from 'redis'

export class DrayJob extends EventEmitter {
	constructor(manager, parameters) {
		super();
		this._manager = manager;
		this._steps = [];
		this.setParameters(parameters);

		this.on('statusChanged', this._statusChanged.bind(this))
	}

	/**
	 * Number of steps already completed
	 *
	 * @returns {Number}    number of completed steps
	 * @returns {undefined} if first step hasn't finished yet
	 */
	get stepsCompleted() {
		return this._stepsCompleted;
	}

	/**
	 * Job status
	 *
	 * @returns {String} 'running'|'error'|'complete'
	 */
	get status() {
		return this._status;
	}

	/**
	 * Job creation date
	 *
	 * @returns {Date} creation date
	 */
	get createdAt() {
		return this._createdAt;
	}

	/**
	 * Job finish date.
	 *
	 * @returns {Date}      job finish date
	 * @returns {undefined} if job is still running
	 */
	get finishedIn() {
		return this._finishedIn;
	}

	get logs() {

	}

	setParameters(parameters) {
		// name, environment, input
		Object.assign(this, parameters);
	}

	addStep(step) {
		this._steps.push(step);
	}

	submit() {
		this._promise = new Promise((resolve, reject) => {
			this._resolve = resolve;
			this._reject = reject;
		});
		this._redis = redis.createClient(this._manager._redisUrl);
		this._redis.on('pmessage', this._onMessage.bind(this));

		this._manager.submitJob(this).then(() => {
			this._redis.psubscribe(`${this.id}:*`);
		});

		return this._promise;
	}

	toJSON() {
		let output = {
			steps: this._steps
		};
		for (let variable of ['name', 'environment']) {
			if (this[variable]) {
				output[variable] = this[variable];
			}
		}

		if (this.input) {
			output.input = new Buffer(this.input).toString('base64');
		}
		return JSON.stringify(output);
	}

	destroy() {
		this._manager.deleteJob(this);
	}

	_onMessage(channel, message, data) {
		// Message is in "ID:property" format
		let [_, property] = message.split(':');
		this.emit(`${property}Changed`, data);
	}

	_statusChanged(newStatus) {
		this._status = newStatus;
		if (this._status == 'complete') this._resolve();
		else if (this._status == 'error') this._reject();
	}
}
