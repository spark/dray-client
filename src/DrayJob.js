import 'babel-polyfill';
import { EventEmitter } from 'events';

export class DrayJob extends EventEmitter {
	constructor({name, environment, input}) {

	}

	/**
	 * ID of the Dray job
	 *
	 * @returns {String}
	 */
	get id() {
		return this._id;
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

	addStep() {

	}

	submit() {
		// TODO: Convert input to base64
	}

	update() {

	}

	destroy() {

	}
}
