[![Build Status](https://travis-ci.com/spark/dray-client.svg?token=M4rP8W5QPGszZyem6TGE&branch=master)](https://travis-ci.com/spark/dray-client)

## Usage

Before creating jobs, you need to initialize the job manager:

```js
import { DrayManager } from 'dray-client';

let manager = new DrayManager(
	'http://0.0.0.0:3000',   // Dray URL
	'redis://127.0.0.1:6379' // Redis URL
);
```

### Fire and forget

```js
let job = manager.createJob();

job.addStep({
	source: 'foo/bar' // Container to be run
});

// Fire and forget!
job.submit();
```

### Wait for result
```js
let job = manager.createJob({
	input: 'foo' // Data passed to container
});
job.addStep({
	source: 'centurylink/upper' // Container to be run
});
// Fire and wait for promise
job.submit().then((value) => {
	console.log("Result:", value);
}, (reason) => {
	console.error("Something bad happened:", reason)
});
```
