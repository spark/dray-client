const chai = require('chai');
const sinon = require('sinon');
chai.use(require('sinon-chai'));
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
		let job1, job2;
		let stub;

		before('starts two jobs', () => {
			job1 = manager.createJob();
			job1.addStep({source: 'busybox'});

			job2 = manager.createJob();
			job2.addStep({source: 'busybox'});

			stub = sinon.stub();
			job1.on('statusChanged', stub);
			job2.on('statusChanged', stub);

			return Promise.all([
				job1.submit(), job2.submit()
			]);
		});

		it('receives updates', function () {
			return expect(stub).to.have.been.calledWith('complete').calledTwice;
		});

		it('lists jobs', () => {
			return expect(manager.listJobs()).to.eventually.have.length.of(2);
		});

		it('removes those jobs', () => {
			return Promise.all([
				job1.destroy(), job2.destroy()
			]);
		});

		it('has no more jobs', () => {
			return expect(manager.listJobs()).to.eventually.have.length.of(0);
		});
	});
});
