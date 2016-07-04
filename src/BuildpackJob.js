import 'babel-polyfill';
import archiver from 'archiver';
import redis from 'redis';
import bluebird from 'bluebird';
bluebird.promisifyAll(redis.RedisClient.prototype);

import { PassThrough } from 'stream';
import { DrayJob } from './DrayJob';

export class BuildpackJob extends DrayJob {
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

	addFiles(files) {
		this._files.push(...files);
		return this;
	}

	setBuildpacks(buildpacks) {
		this._buildpacks = buildpacks;
		this._buildpacks.push('particle/buildpack-store');
		return this;
	}

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

		return new Promise((resolve) => {
			// If we have files to compile, archive them first
			if (this._files.length > 0) {
				return resolve(this._archiveFiles().then((archive) => {
					this.setInput(archive);
				}));
			}
			resolve();
		}).then(() => {
			// Submit this as any regular job
			return super.submit(timeout);
		}).then(() => {
			this.destroy();
			// Compilation finished. Any contents of last buildpack's output
			// should be in Redis. Just fetch and return it
			let client = redis.createClient(this._manager._redisUrl);
			return client.hgetallAsync(this.id).then((value) => {
				client.quit();
				return value;
			});
		}, () => {
			return this.getLogs().then((logs) => {
				this.destroy();
				// Because successful `getLogs` call resolves instead of rejecting
				// we're returning a rejected promise instead
				return Promise.reject(logs);
			});
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
