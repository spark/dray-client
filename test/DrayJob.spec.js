/*eslint-env and, mocha */
import chai from 'chai';
chai.use(require('chai-as-promised'));
const expect = chai.expect;
import sinon from 'sinon';

import {DrayJob} from '../src/DrayJob';
import TimeoutError from '../src/TimeoutError';

function _stubRedisClient(job) {
	job._createRedisClient = () => {
		return {
			on: sinon.stub(),
			unsubscribe: sinon.stub(),
			quit: sinon.stub()
		}
	};
}

describe('DrayJob', () => {
	describe('setEnvironment', () => {
		it('sets environment', () => {
			let job = new DrayJob();
			let that = job.setEnvironment({FOO: 'BAR'});
			expect(that).to.equal(job);
			expect(job._environment).to.eql({FOO: 'BAR'});
		});
	});

	describe('toJSON', () => {
		it('serializes basic object', () => {
			let job = new DrayJob();

			job.addStep('scratch');

			expect(JSON.parse(job.toJSON())).to.eql({
				steps: [{
					source: 'scratch'
				}]
			});
		});

		it('serializes full object', () => {
			let job = new DrayJob();
			job.setEnvironment({FOO: 'BAR'})
				.setInput('boo');
			job.setParameters({
				name: 'foo',
			});
			job.addStep('scratch', {
				BAR: 'BAZ'
			}, 'step1', 'output.txt', true, 'host', 1, 2, 10);

			expect(JSON.parse(job.toJSON())).to.eql({
				steps: [{
					source: 'scratch',
					environment: [
						{variable: 'BAR', value: 'BAZ'}
					],
					name: 'step1',
					output: 'output.txt',
					refresh: true,
					networkMode: 'host',
					cpuShares: 1,
					memory: 2,
					timeout: 10
				}],
				name: 'foo',
				environment: [
					{variable: 'FOO', value: 'BAR'}
				],
				input: 'Ym9v',
			});
		});
	});

	describe('submit', () => {
		it('rejects promise on Redis error', function() {
			let job = new DrayJob();
			job._manager = {
				_redisUrl: 'redis://127.0.0.1:1234',
				_submitJob: () => {
					return {then: sinon.stub()};
				}
			};

			let promise = job.submit();
			return expect(promise).to.eventually.be.rejected;
		});

		it('rejects promise on submission error', () => {
			let job = new DrayJob();
			let ex = new Error('My error');

			_stubRedisClient(job);

			job._manager = {
				_submitJob: () => {
					return Promise.reject(ex);
				}
			};

			let promise = job.submit();
			return expect(promise).to.eventually.be.rejectedWith(ex);
		});

		it('rejects on timeout', () => {
			let job = new DrayJob();

			_stubRedisClient(job);

			job._manager = {
				_submitJob: () => {
					return new Promise(() => {}, () => {});
				}
			};

			let promise = job.submit(1);
			return expect(promise).to.eventually.be.rejectedWith(TimeoutError);
		});
	});
});
