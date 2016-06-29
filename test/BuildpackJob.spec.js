import chai from 'chai';
import sinon from 'sinon';
chai.use(require('sinon-chai'));
chai.use(require('chai-as-promised'));
const expect = chai.expect;

import fs from 'fs';
import {BuildpackJob} from '../src/BuildpackJob'

describe('BuildpackJob', () => {
	describe('when adding files', () => {
		let compilation;

		before(() => {
			compilation = new BuildpackJob();
			compilation._manager = {
				submitJob: sinon.stub().returns(Promise.resolve())
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

		it('archives them as tar.gz', () => {
			let tgz = fs.readFileSync(`${__dirname}/data/archive.tar.gz`);
			return expect(compilation._archiveFiles()).to.eventually.deep.equal(tgz);
		});
	});
});
