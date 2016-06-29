import chai from 'chai';
chai.use(require('chai-as-promised'));
const expect = chai.expect;

import {DrayJob} from '../src/DrayJob'

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
			job.setEnvironment({FOO: 'BAR'});
			job.setParameters({
				name: 'foo',
				input: 'boo',
			});
			job.addStep('scratch', {
				BAR: 'BAZ'
			}, 'step1', 'output.txt', true);

			expect(JSON.parse(job.toJSON())).to.eql({
				steps: [{
					source: 'scratch',
					environment: [
						{variable: 'BAR', value: 'BAZ'}
					],
					name: 'step1',
					output: 'output.txt',
					refresh: true
				}],
				name: 'foo',
				environment: [
					{variable: 'FOO', value: 'BAR'}
				],
				input: 'Ym9v',
			});
		});
	});
});
