import 'babel-polyfill';
import { EventEmitter } from 'events';
import redis from 'redis';

export class DrayJob extends EventEmitter {
	constructor(manager, parameters) {
		super();
		this._manager = manager;
		this._steps = [];
		this.setParameters(parameters);

		this.on('statusChanged', this._statusChanged.bind(this));
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

	/**
	 * Get array of job logs
	 *
	 * @returns {Array} job logs
	 */
	get logs() {

	}

	/**
	 * Set job parameters from passed object
	 *
	 * @param {Object} parameters One of the following: name, environment, input
	 * @returns {this} this object
	 */
	setParameters(parameters) {
		Object.assign(this, parameters);
		return this;
	}

	/**
	 * Add single job step
	 *
	 * @param {Object} step Dray step definition
	 * @returns {this} this object
	 */
	addStep(step) {
		this._steps.push(step);
		return this;
	}

	/**
	 * Submit job for execution
	 *
	 * @param {Object} timeout (optional) Timeout in ms
	 * @returns {Promise} Resolved when job succeeds and rejected if fails
	 */
	submit(timeout) {
		this._promise = new Promise((resolve, reject) => {
			this._resolve = resolve;
			this._reject = reject;
		});
		this._redis = redis.createClient(this._manager._redisUrl);
		this._redis.on('pmessage', this._onMessage.bind(this));

		this._manager.submitJob(this).then(() => {
			this._redis.psubscribe(`${this.id}:*`);
		});

		if (timeout) {
			this._timout = setTimeout(() => {
				this._onJobFailed('Job has timed out');
			}, timeout);
		}

		return this._promise;
	}

	/**
	 * Serialize job to Dray format
	 *
	 * @returns {String} Job JSON
	 */
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

	/**
	 * Destroy job in Dray
	 *
	 * @returns {Promise} Resolved once job is destroyed
	 */
	destroy() {
		this._manager.deleteJob(this);
	}

	/**
	 * Redis message handler
	 *
	 * @param {String} channel Channel name
	 * @param {String} message Message contents
	 * @param {String} data    Additional data
	 * @returns {undefined}
	 */
	_onMessage(channel, message, data) {
		// Message is in "ID:property" format
		let [_, property] = message.split(':');
		this.emit(`${property}Changed`, data);
	}

	_onJobCompleted(value) {
		this._resolve(value);
	}

	_onJobFailed(reason) {
		this._reject(reason);
		this._cleanup();
	}

	_statusChanged(newStatus) {
		this._status = newStatus;
		if (this._status === 'complete') {
			this._onJobCompleted();
		} else if (this._status === 'error') {
			this._onJobFailed();
		}
	}

	_cleanup() {
		if (this._timeout) {
			clearTimeout(this._timeout);
		}
		this._redis.quit();
	}
}
