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

### Start compilation job
```js
import { BuildpackJob } from 'dray-client';
let compilation = new BuildpackJob(manager);
compilation.setFiles([
	{name: 'foo.ino', data: new Buffer()}
]);
compilation.setEnvironment({
	PLATFORM_ID: 6
});
compilation.setBuildpacks([
	'particle/buildpack-wiring-preprocessor',
	'particle/buildpack-particle-firmware:0.5.1-photon'
]);
compilation.submit().then((binaries) => {
	// Do something with binaries
}, (reason) => {
	console.error("Compilation error:", reason)
});
```
