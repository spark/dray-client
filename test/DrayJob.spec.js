const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;

import {DrayJob} from '../src/DrayJob'

describe('DrayJob', () => {
	describe('toJSON', () => {
		it('serialize object', () => {
			let job = new DrayJob();
			job.setParameters({
				name: 'foo',
				environment: [
					{name: 'BAR', value: 'BAZ'}
				],
				input: 'boo',
				steps: [{
					source: 'scratch'
				}]
			});

			expect(job.toJSON()).to.equal('{"steps":[],"name":"foo","environment":[{"name":"BAR","value":"BAZ"}],"input":"Ym9v"}');
		});
	});
});
