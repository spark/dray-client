import 'babel-polyfill';
import archiver from 'archiver';
import { PassThrough } from 'stream';
import { DrayJob } from './DrayJob';

export class BuildpackJob extends DrayJob {
	constructor(manager, parameters, redisExpireIn=600) {
		super(manager, parameters);

		this._redisExpireIn = redisExpireIn;
		this._files = [];
	}

	addFiles(files) {
		this._files.push(...files);
	}

	submit(timeout) {
		if (this._files.length > 0) {
			this.setInput(this._archiveFiles());
		}
		super.submit(timeout);
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
		let buffer = Buffer.alloc(0);
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
