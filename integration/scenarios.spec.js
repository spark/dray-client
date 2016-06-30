import chai from 'chai';
import sinon from 'sinon';
chai.use(require('sinon-chai'));
chai.use(require('chai-as-promised'));
const expect = chai.expect;

import fs from 'fs'
import {DrayManager} from '../src/DrayManager'
import {BuildpackJob} from '../src/BuildpackJob'

describe('Dray client', () => {
	let manager;

	before(() => {
		manager = new DrayManager(
			'http://0.0.0.0:3000',
			'redis://10.2.30.118:6379'
		);
	});

	xdescribe('Basic jobs', () => {
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

	describe('Buildpack job', function() {
		this.timeout(20000);
		let compilation;

		beforeEach(() => {
			compilation = new BuildpackJob(manager);

			compilation.addFiles([{
				name: 'blink.ino',
				data: fs.readFileSync(`${__dirname}/../test/data/blink.ino`)
			}]);

			compilation.setEnvironment({
				PLATFORM_ID: 6
			});

			compilation.setBuildpacks([
				// 'particle/buildpack-wiring-preprocessor',
				// 'particle/buildpack-particle-firmware:0.5.1-photon'
				'digistump/buildpack-oak'
			]);
		});

		xit('compiles and returns binaries', () => {
			let promise = compilation.submit();
			return Promise.all([
				expect(promise).to.be.fulfilled,
				expect(promise).to.eventually.have.property('firmware.bin')
			]);
		});

		it('rejects with logs', () => {

			compilation._files = [];
			compilation.addFiles([{
				name: 'blink.ino',
				data: fs.readFileSync(`${__dirname}/../test/data/blink-with-error.ino`)
			}]);

			let promise = compilation.submit();
			return Promise.all([
				expect(promise).to.be.rejectedWith(Array)
			]);
		});
	});
});
