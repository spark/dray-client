const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;

import {DrayManager} from '../src/DrayManager'

describe('Dray client', () => {
	let manager;

	before(() => {
		manager = new DrayManager(
			'http://0.0.0.0:3000',
			'redis://127.0.0.1:6379'
		);
	});

	describe('', () => {
		before('start two jobs', () => {
			let job1 = manager.createJob();
			job1.addStep({source: 'scratch'});
			job1.submit();
			let job2 = manager.createJob();
			job2.addStep({source: 'scratch'});
			job2.submit();
		});

		it('lists jobs', () => {
			return expect(manager.listJobs()).to.eventually.have.length.of(2);
		});
	})
});
