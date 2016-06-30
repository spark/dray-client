import 'babel-polyfill';
import { EventEmitter } from 'events';
import redis from 'redis';

export class DrayJob extends EventEmitter {
	constructor(manager, parameters) {
		super();
		this._manager = manager;
		this._steps = [];
		this._environment = {};
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
	 * Set job environment shared between steps
	 *
	 * @param {Object} env Object of environment variables
	 * @returns {this} this object
	 */
	setEnvironment(env) {
		Object.assign(this._environment, env);
		return this;
	}

	setInput(input) {
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
	addStep(source, environment, name, output, refresh) {
		this._steps.push({source, environment, name, output, refresh});
		return this;
	}

	/**
	 * Submit job for execution
	 *
	 * @param {Object} timeout (optional) Timeout in ms
	 * @returns {Promise} Resolved when job succeeds and rejected if fails
	 */
	submit(timeout) {
		// Prepare submission promise
		this._promise = new Promise((resolve, reject) => {
			this._resolve = resolve;
			this._reject = reject;
		});
		// Connect to Redis
		this._subscription = redis.createClient(this._manager._redisUrl);
		// Hook onMessage handler
		this._subscription.on('pmessage', this._onMessage.bind(this));

		// Submit the job...
		this._manager.submitJob(this).then(() => {
			// ...and once we know its ID, we can listen for change events
			this._subscription.psubscribe(`${this.id}:*`);
		});

		// If job timeout is specified
		if (timeout) {
			this._timout = setTimeout(() => {
				// Fail the job when timeout reached
				this._onJobFailed('Job has timed out');
			}, timeout);
		}

		return this._promise;
	}

	/**
	 * Destroy job in Dray
	 *
	 * @returns {Promise} Resolved once job is destroyed
	 */
	destroy() {
		this._cleanup();
		return this._manager.deleteJob(this);
	}


	/**
	 * Get array of job logs
	 *
	 * @returns {Promise} promise resolved with {Array} of logs
	 */
	getLogs() {
		return this._manager.getJobLogs(this);
	}

	/**
	 * Serialize job to Dray format
	 *
	 * @returns {String} Job JSON
	 */
	toJSON() {
		let output = {
			steps: this._steps.map((item) => {
				// Convert environment object to Dray format
				if (item.environment && Object.keys(item.environment).length > 0) {
					item.environment = this._mapEnvironment(item.environment);
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
		if (this._subscription) {
			this._subscription.unsubscribe();
			this._subscription.quit();
		}
	}

	_mapEnvironment(env) {
		return Object.keys(env).map((key) => {
			return { variable: key, value: env[key].toString() };
		});
	}
}
