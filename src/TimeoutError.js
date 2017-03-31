import VError from 'verror';

class TimeoutError extends VError {
	constructor() {
		super(...arguments);
		this.name = this.constructor.name;
	}

	static matches(error) {
		return error.name && (error.name === this.name);
	}
}

export default TimeoutError;
