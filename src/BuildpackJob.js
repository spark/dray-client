import 'babel-polyfill';
import { DrayJob } from './DrayJob';

export class BuildpackJob extends DrayJob {
	constructor(manager, parameters, redisExpireIn=600) {
		super(manager, parameters);

		this._redisExpireIn = redisExpireIn;
	}


}
