import archiver from 'archiver';
import redis from 'redis';
import bluebird from 'bluebird';
bluebird.promisifyAll(redis.RedisClient.prototype);

import { PassThrough } from 'stream';
import { DrayJob } from './DrayJob';

export class BuildpackJob extends DrayJob {
	/**
	 * BuildpackJob class constructor.
	 *
	 * @param {DrayManager} manager {DrayManager} instance
	 * @param {Object} parameters Parameters to set
	 * @param {Number} redisExpireIn Expiration time in seconds for output stored in Redis
	 */
	constructor(manager, parameters, redisExpireIn=600) {
		super(manager, parameters);

		this._redisExpireIn = redisExpireIn;
		this._files = [];
		this._buildpacks = [];

		if (this._manager) {
			this.setEnvironment({
				REDIS_URL: this._manager._redisUrl,
				REDIS_EXPIRE_IN: this._redisExpireIn
			});
		}
	}

	/**
	 * Add files to the job.
	 * Array should contain {Object}s with `filename` {String} and
	 * `data` {Buffer} or {String} properties. I.e.:
	 *
	 * job.addFiles([{
	 * 	filename: 'foo.ino',
	 * 	data: fs.readFileSync('foo.ino')
	 * }]);
	 *
	 * @param {Array} files Array of files to add
	 * @returns {this} `this` object
	 */
	addFiles(files) {
		this._files.push(...files);
		return this;
	}

	/**
	 * Sets buildpacks to be used during compilation.
	 * List will be appended by storing buildpack.
	 *
	 * @param {Array} buildpacks {Array} of {String}s specifying Docker images
	 * @returns {this} `this` object
	 */
	setBuildpacks(buildpacks) {
		this._buildpacks = buildpacks;
		this._buildpacks.push('particle/buildpack-store');
		return this;
	}

	/**
	 * Submits job
	 *
	 * @param  {Number} timeout Job timeout in ms
	 * @return {Promise} Will resolve when job finished.
	 */
	submit(timeout) {
		for (let buildpack of this._buildpacks) {
			// We want each buildpack to pass output directory to input of a
			// next one. Setting following envs and output argument does that
			let env = {
				INPUT_FROM_STDIN: true,
				ARCHIVE_OUTPUT: true
			};
			this.addStep(buildpack, env, undefined, '/output.tar.gz');
		}

		return new Promise(this._prepareInput.bind(this))
			.then(super.submit.bind(this, timeout))
			.then(this._onResolved.bind(this),
						this._onRejected.bind(this));
	}

	/**
	 * If any files were passed, archive them and set as input.
	 *
	 * @param {Function} callback Callback when finished
	 * @returns {Mixed} {undefined} or result of the callback
	 */
	_prepareInput(callback) {
		// If we have files to compile, archive them first
		if (this._files.length > 0) {
			return callback(this._archiveFiles().then((archive) => {
				this.setInput(archive);
			}));
		}
		callback();
	}

	/**
	 * Callback for successful compilation. Any contents of last buildpack's
	 * output should be in Redis. This will fetch and return it.
	 *
	 * @returns {Promise} Resolved with job output
	 */
	_onResolved() {
		this.destroy();
		// Compilation finished.
		let client = redis.createClient(this._manager._redisUrl);
		return client.hgetallAsync(this.id).then((output) => {
			client.quit();
			// Return the output
			return output;
		});
	}

	/**
	 * Callback for failed compilation.
	 *
	 * @return {Promise} Rejected promise with logs
	 */
	_onRejected() {
		return this.getLogs().then((logs) => {
			this.destroy();
			// Because successful `getLogs` call resolves instead of rejecting
			// we're returning a rejected promise instead
			return Promise.reject(logs);
		});
	}

	/**
	 * Create tar.gz archive from files
	 *
	 * @returns {Buffer} archived files
	 * @private
	 */
	_archiveFiles() {
		// Defer promise
		let _resolve, _reject;
		let promise = new Promise((resolve, reject) => {
			_resolve = resolve;
			_reject = reject;
		});
		// Prepare output stream and buffer
		let stream = new PassThrough();
		let buffer = new Buffer('');
		stream.on('finish', () => {
			_resolve(buffer);
		});
		stream.on('data', (data) => {
			buffer = Buffer.concat([buffer, data]);
		});

		// Initialize archiver
		let archive = archiver('tar', {gzip: true});
		archive.on('error', (err) => {
			_reject(err);
		});
		archive.pipe(stream);

		// Append all files
		for (let file of this._files) {
			archive.append(file.data, file);
		}
		archive.finalize();
		return promise;
	}
}
