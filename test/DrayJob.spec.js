/*eslint-env and, mocha */
import chai from 'chai';
chai.use(require('chai-as-promised'));
const expect = chai.expect;
import sinon from 'sinon';

import {DrayJob} from '../src/DrayJob';

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
			}, 'step1', 'output.txt', true);
			job.addStep('scratch2', {
				FOO: 'BAR'
			}, 'step2', 'output2.txt');

			expect(JSON.parse(job.toJSON())).to.eql({
				steps: [{
					source: 'scratch',
					environment: [
						{variable: 'BAR', value: 'BAZ'}
					],
					name: 'step1',
					output: 'output.txt',
					refresh: true
				},{
					source: 'scratch2',
					environment: [
						{variable: 'FOO', value: 'BAR'}
					],
					name: 'step2',
					output: 'output2.txt'
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
	});
});
