import 'babel-polyfill';
import { EventEmitter } from 'events';

export class DrayJob extends EventEmitter {
	constructor(manager, parameters) {
		super();
		this._manager = manager;
		this._steps = [];
		this.setParameters(parameters);
	}

	/**
	 * Number of steps already completed
	 *
	 * @returns {Number}
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
	 * @returns {Date}
	 */
	get createdAt() {
		return this._createdAt;
	}

	/**
	 * Job finish date.
	 *
	 * @returns {Date}
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
		this._manager.submitJob(this);
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

		// TODO: Convert input to base64
		return JSON.stringify(output);
	}

	destroy() {
		this._manager.deleteJob(this);
	}
}
