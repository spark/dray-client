/*eslint-env and, mocha */
import chai from 'chai';
import sinon from 'sinon';
chai.use(require('sinon-chai'));
chai.use(require('chai-as-promised'));
const expect = chai.expect;

import fs from 'fs';
import {DrayJob} from '../src/DrayJob';
import {BuildpackJob} from '../src/BuildpackJob';

describe('BuildpackJob', () => {
	describe('constructor', () => {
		it('sets up the object', () => {
			let job = new BuildpackJob({
				_redisUrl: 'foo'
			}, {
				name: 'bar'
			},
			123);
			expect(job._redisExpireIn).to.equal(123);
			expect(job._environment.REDIS_URL).to.equal('foo');
			expect(job._environment.REDIS_EXPIRE_IN).to.equal(123);
			expect(job.name).to.equal('bar');
		});
	});

	describe('setting buildpacks', () => {
		it('appends storing one', () => {
			let job = new BuildpackJob();
			job.setBuildpacks(['foo', 'bar']);
			expect(job._buildpacks).to.have.length.of(3);
			expect(job._buildpacks[0]).to.equal('foo');
		});
	});

	describe('submit', () => {
		let sandbox;

		it('creates steps from buildpacks', () => {
			sandbox = sinon.sandbox.create();
			sandbox.stub(DrayJob.prototype, 'submit');

			let job = new BuildpackJob();
			job.setBuildpacks(['foo']);
			job.submit();
			expect(job._steps).to.have.length.of(2);
			expect(job._steps[0]).to.eql({
				environment: {
					ARCHIVE_OUTPUT: true,
					INPUT_FROM_STDIN: true,
				},
				name: undefined,
				output: '/output.tar.gz',
				refresh: undefined,
				source: 'foo'
			});

			sandbox.restore();
		});

		it('creates step from object', () => {
			sandbox = sinon.sandbox.create();
			sandbox.stub(DrayJob.prototype, 'submit');

			let job = new BuildpackJob();
			job.setBuildpacks([{
				source: 'foo',
				networkMode: 'host',
				cpuShares: 1,
				memory: 2,
				timeout: 10
			}]);
			job.submit();
			expect(job._steps).to.have.length.of(2);
			expect(job._steps[0]).to.eql({
				environment: {
					ARCHIVE_OUTPUT: true,
					INPUT_FROM_STDIN: true,
				},
				name: undefined,
				output: '/output.tar.gz',
				refresh: undefined,
				source: 'foo',
				networkMode: 'host',
				cpuShares: 1,
				memory: 2,
				timeout: 10
			});

			sandbox.restore();
		});
	});

	describe('archiving files', () => {
		let compilation;

		before(() => {
			compilation = new BuildpackJob();
			compilation._manager = {
				_submitJob: sinon.stub().returns(Promise.resolve())
			};
			compilation.setInput = sinon.stub();

			compilation.addFiles([{
				name: 'blink.ino',
				data: fs.readFileSync(`${__dirname}/data/blink.ino`),
				date: new Date('2016-06-29T13:56:52.201Z')
			}, {
				name: 'inc/foo.h',
				data: fs.readFileSync(`${__dirname}/data/inc/foo.h`),
				date: new Date('2016-06-29T13:56:52.201Z')
			}]);
		});

		it('creates tar.gz archive', () => {
			let tgz = fs.readFileSync(`${__dirname}/data/archive.tar.gz`);
			return expect(compilation._archiveFiles()).to.eventually.deep.equal(tgz);
		});
	});
});
