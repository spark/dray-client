## Usage

### Fire and forget
```js
import { DrayJob } from 'dray-client';

let job = new DrayJob();
job.addStep({
	source: 'foo/bar' // Container to be run
});
// Fire and forget!
job.submit();
```

### Wait for result
```js
import { DrayJob } from 'dray-client';

let job = new DrayJob();
job.addStep({
	source: 'centurylink/upper', // Container to be run
	input: 'foo' // Data passed to container
});
// Fire and wait for promise
job.submit().then((value) => {
	console.log("Result:", value);
}, (reason) => {
	console.error("Something bad happened:", reason)
});
```
