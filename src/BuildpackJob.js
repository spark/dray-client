import archiver from 'archiver';
import redis from 'redis';
import bluebird from 'bluebird';
bluebird.promisifyAll(redis.RedisClient.prototype);
import gunzip from 'gunzip-maybe';
import tar from 'tar-stream';
import { Duplex } from 'stream';

import { PassThrough } from 'stream';
import { DrayJob } from './DrayJob';

/**
 * Dray job that uses Particle Buildpacks
 * @module
 */
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

			if (typeof buildpack === 'string') {
				this.addStep(buildpack, env, undefined, '/output.tar.gz');
			} else {
				let args = [
					buildpack.source,
					env,
					buildpack.name,
					'/output.tar.gz',
					buildpack.refresh ? buildpack.refresh : undefined,
					buildpack.networkMode ? buildpack.networkMode : undefined,
					buildpack.cpuShares ? buildpack.cpuShares : undefined,
					buildpack.memory ? buildpack.memory : undefined,
					buildpack.timeout ? buildpack.timeout : undefined
				];
				this.addStep.apply(this, args);
			}
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
	 * @private
	 */
	_prepareInput(callback) {
		// If we have files to compile, archive them first
		if (this._files.length > 0) {
			return callback(this._archiveFiles(this._files).then((archive) => {
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
	 * @private
	 */
	_onResolved() {
		// Compilation finished.
		let client = redis.createClient(this._manager._redisUrl, {
			'return_buffers': true
		});
		return client.getAsync(`jobs:${this.id}:output`).then((output) => {
			// Unpack the output
			if (output) {
				let promise = this._unarchiveFiles(output);
				promise.then(() => client.quit(), () => client.quit());
				return promise;
			}

			client.quit();
			// Return the empty output
			return output;
		}, (reason) => reason);
	}

	/**
	 * Callback for failed compilation.
	 *
	 * @param {Object} reason Reason for the rejection
	 * @return {Promise} Rejected promise with logs
	 * @private
	 */
	_onRejected(reason) {
		if (reason) {
			return Promise.reject(reason);
		}
		return this.getLogs().then((logs) => {
			// Because successful `getLogs` call resolves instead of rejecting
			// we're returning a rejected promise instead
			return Promise.reject(logs);
		});
	}

	/**
	 * Create tar.gz archive from files
	 *
	 * @param {Array} files An array of files to archive
	 * @returns {Promise} A promise resolved with a {Buffer} containing the archive
	 * @private
	 */
	_archiveFiles(files) {
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
		let archive = archiver('tar', { gzip: true });
		archive.on('error', (err) => {
			_reject(err);
		});
		archive.pipe(stream);

		// Append all files
		for (let file of files) {
			archive.append(file.data, file);
		}
		archive.finalize();
		return promise;
	}

	/**
	 * Turn a typed array to stream
	 *
	 * @param {UInt8Array} array Array to convert
	 * @returns {Stream} Converted stream
	 * @private
	 */
	_typedArrayToStream(array) {
		const duplex = new Duplex();
		duplex.push(array);
		duplex.push(null);

		return duplex;
	}

	/**
	 * Untar tar.gz compressed output
	 *
	 * @param {UInt8Array} archive Typed array containing .tar.gz archive
	 * @returns {Promise} Promise resolved with the files
	 * @private
	 */
	_unarchiveFiles(archive) {
		return new Promise((resolve, reject) => {
			const extract = tar.extract();
			const duplex = this._typedArrayToStream(archive);
			let files = {};

			extract.on('entry', (header, stream, next) => {
				if (header.type !== 'file') {
					next();
					return;
				}

				const filename = header.name.replace('./', '');
				files[filename] = [];

				stream.on('data', (chunk) => {
					files[filename].push(chunk);
				});

				stream.on('end', () => {
					files[filename] = Buffer.concat(files[filename]);
					next();
				});

				stream.resume();
			});

			extract.on('finish', () => {
				resolve(files);
			});

			extract.on('error', (error) => reject(error));

			duplex.pipe(gunzip()).pipe(extract);
		});
	}
}
