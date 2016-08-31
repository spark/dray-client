/*eslint-env and, mocha */
import chai from 'chai';
chai.use(require('chai-things'));
chai.use(require('chai-as-promised'));
const expect = chai.expect;
import sinon from 'sinon';
import bluebird from 'bluebird';

import {DrayManager, DrayJob} from '../src/DrayManager'

describe('DrayManager', () => {
	let manager = new DrayManager();

	describe('createJob', () => {
		it('creates DrayJob instance with parameters set', () => {
			let job = manager.createJob({name: 'foo'});
			expect(job.name).to.equal('foo');
		});
	});

	describe('listJobs', () => {
		it('resolves DrayJob instances', () => {
			manager._request = sinon.stub().returns(
				bluebird.Promise.resolve({
					res: {
						body: [
							{id: 'foo'},
							{id: 'bar'}
						]
					}
				})
			);
			let jobs = manager.listJobs();
			return bluebird.Promise.all([
				expect(jobs).to.eventually.have.length(2)
			]);
		});
	});
});
