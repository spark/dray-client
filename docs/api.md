# constructor

[src/DrayManager.js:13-17](https://github.com/spark/dray-client/blob/faea440b27b37b69251414c69cc5e25151aa7154/src/DrayManager.js#L13-L17 "Source code on GitHub")

DrayManager class constructor.

**Parameters**

-   `drayUrl` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** URL for Dray instance
-   `redisUrl` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** URL for Redis instance

# createJob

[src/DrayManager.js:25-29](https://github.com/spark/dray-client/blob/faea440b27b37b69251414c69cc5e25151aa7154/src/DrayManager.js#L25-L29 "Source code on GitHub")

Instantiate, set parameters and return {DrayJob}

**Parameters**

-   `parameters` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** Parameters to set

Returns **DrayJob** Job ready to execute

# listJobs

[src/DrayManager.js:36-43](https://github.com/spark/dray-client/blob/faea440b27b37b69251414c69cc5e25151aa7154/src/DrayManager.js#L36-L43 "Source code on GitHub")

List submitted Dray jobs

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)** Resolves into {Array} of jobs

# \_submitJob

[src/DrayManager.js:51-56](https://github.com/spark/dray-client/blob/faea440b27b37b69251414c69cc5e25151aa7154/src/DrayManager.js#L51-L56 "Source code on GitHub")

Submit the job to Dray

**Parameters**

-   `job` **DrayJob** Job to submit

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)** Resolves to {DrayJob} if success

# \_deleteJob

[src/DrayManager.js:64-68](https://github.com/spark/dray-client/blob/faea440b27b37b69251414c69cc5e25151aa7154/src/DrayManager.js#L64-L68 "Source code on GitHub")

Delete job from Dray

**Parameters**

-   `job` **DrayJob** Job to delete

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)** Resolves with Dray result

# \_getJobLogs

[src/DrayManager.js:76-80](https://github.com/spark/dray-client/blob/faea440b27b37b69251414c69cc5e25151aa7154/src/DrayManager.js#L76-L80 "Source code on GitHub")

Get logs for specified job

**Parameters**

-   `job` **DrayJob** Job for which to get logs

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)** Resolves to and {Array} containing logs

# \_request

[src/DrayManager.js:89-91](https://github.com/spark/dray-client/blob/faea440b27b37b69251414c69cc5e25151aa7154/src/DrayManager.js#L89-L91 "Source code on GitHub")

Send a request to Dray instance

**Parameters**

-   `url` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** URL appended to Dray's URL
-   `method` **\[[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)](default 'get')** (optional) HTTP method, defaults to GET
-   `data` **\[Mixed](default undefined)** (optional) Data to be passed

# constructor

[src/DrayJob.js:12-20](https://github.com/spark/dray-client/blob/faea440b27b37b69251414c69cc5e25151aa7154/src/DrayJob.js#L12-L20 "Source code on GitHub")

DrayJob class constructor.

**Parameters**

-   `manager` **DrayManager** {DrayManager} instance
-   `parameters` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** Parameters to set

# stepsCompleted

[src/DrayJob.js:28-30](https://github.com/spark/dray-client/blob/faea440b27b37b69251414c69cc5e25151aa7154/src/DrayJob.js#L28-L30 "Source code on GitHub")

Number of steps already completed

Returns **[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)** Number of completed steps

Returns **[undefined](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/undefined)** If first step hasn't finished yet

# status

[src/DrayJob.js:37-39](https://github.com/spark/dray-client/blob/faea440b27b37b69251414c69cc5e25151aa7154/src/DrayJob.js#L37-L39 "Source code on GitHub")

Job status

Returns **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** 'running'|'error'|'complete'

# createdAt

[src/DrayJob.js:46-48](https://github.com/spark/dray-client/blob/faea440b27b37b69251414c69cc5e25151aa7154/src/DrayJob.js#L46-L48 "Source code on GitHub")

Job creation date

Returns **[Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)** Job creation date

# finishedIn

[src/DrayJob.js:56-58](https://github.com/spark/dray-client/blob/faea440b27b37b69251414c69cc5e25151aa7154/src/DrayJob.js#L56-L58 "Source code on GitHub")

Job finish date.

Returns **[Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)** Job finish date

Returns **[undefined](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/undefined)** If job is still running

# setParameters

[src/DrayJob.js:66-69](https://github.com/spark/dray-client/blob/faea440b27b37b69251414c69cc5e25151aa7154/src/DrayJob.js#L66-L69 "Source code on GitHub")

Set job parameters from passed object

**Parameters**

-   `parameters` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** One of the following: name, input

Returns **this** `this` object

# setEnvironment

[src/DrayJob.js:77-80](https://github.com/spark/dray-client/blob/faea440b27b37b69251414c69cc5e25151aa7154/src/DrayJob.js#L77-L80 "Source code on GitHub")

Set job environment shared between steps

**Parameters**

-   `env` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** Object of environment variables

Returns **this** `this` object

# setInput

[src/DrayJob.js:88-91](https://github.com/spark/dray-client/blob/faea440b27b37b69251414c69cc5e25151aa7154/src/DrayJob.js#L88-L91 "Source code on GitHub")

Set job input data

**Parameters**

-   `input` **Mixed** Input to be sent

Returns **this** `this` object

# addStep

[src/DrayJob.js:103-106](https://github.com/spark/dray-client/blob/faea440b27b37b69251414c69cc5e25151aa7154/src/DrayJob.js#L103-L106 "Source code on GitHub")

Add a single job step

**Parameters**

-   `source` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** Docker image to be run
-   `environment` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** (optional) Object containing environment variables for this step
-   `name` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** (optional) Name of the step
-   `output` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** (optional) Output channel to be captured
-   `refresh` **[Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** (optional) If true, image will be pulled before

Returns **this** this object

# submit

[src/DrayJob.js:114-140](https://github.com/spark/dray-client/blob/faea440b27b37b69251414c69cc5e25151aa7154/src/DrayJob.js#L114-L140 "Source code on GitHub")

Submit job for execution

**Parameters**

-   `timeout` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** (optional) Timeout in ms

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)** Resolved when job succeeds and rejected if fails

# destroy

[src/DrayJob.js:147-150](https://github.com/spark/dray-client/blob/faea440b27b37b69251414c69cc5e25151aa7154/src/DrayJob.js#L147-L150 "Source code on GitHub")

Destroy job in Dray

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)** Resolved once job is destroyed

# getLogs

[src/DrayJob.js:158-160](https://github.com/spark/dray-client/blob/faea440b27b37b69251414c69cc5e25151aa7154/src/DrayJob.js#L158-L160 "Source code on GitHub")

Get array of job logs

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)** promise resolved with {Array} of logs

# toJSON

[src/DrayJob.js:167-192](https://github.com/spark/dray-client/blob/faea440b27b37b69251414c69cc5e25151aa7154/src/DrayJob.js#L167-L192 "Source code on GitHub")

Serialize job to Dray format

Returns **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** Job JSON

# \_onJobCompleted

[src/DrayJob.js:215-218](https://github.com/spark/dray-client/blob/faea440b27b37b69251414c69cc5e25151aa7154/src/DrayJob.js#L215-L218 "Source code on GitHub")

Callback for a job status changing to "complete"

**Parameters**

-   `value` **Mixed** Value to resolve the promise with

Returns **[undefined](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/undefined)** 

# \_onJobFailed

[src/DrayJob.js:226-229](https://github.com/spark/dray-client/blob/faea440b27b37b69251414c69cc5e25151aa7154/src/DrayJob.js#L226-L229 "Source code on GitHub")

Callback for a job status changing to "error"

**Parameters**

-   `reason` **Mixed** Reason to reject the promise with

Returns **[undefined](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/undefined)** 

# \_statusChanged

[src/DrayJob.js:237-244](https://github.com/spark/dray-client/blob/faea440b27b37b69251414c69cc5e25151aa7154/src/DrayJob.js#L237-L244 "Source code on GitHub")

Callback for a job status changing

**Parameters**

-   `newStatus` **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** New job status

Returns **[undefined](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/undefined)** 

# \_cleanup

[src/DrayJob.js:252-261](https://github.com/spark/dray-client/blob/faea440b27b37b69251414c69cc5e25151aa7154/src/DrayJob.js#L252-L261 "Source code on GitHub")

Cleaning up function. Removes timeout and closes
Redis connection.

Returns **[undefined](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/undefined)** 

# \_mapEnvironment

[src/DrayJob.js:269-273](https://github.com/spark/dray-client/blob/faea440b27b37b69251414c69cc5e25151aa7154/src/DrayJob.js#L269-L273 "Source code on GitHub")

Turn {Object} into env {Array} accepted by Dray.

**Parameters**

-   `env` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** Environment object

Returns **[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)** Array accepted by Dray

# constructor

[src/BuildpackJob.js:18-31](https://github.com/spark/dray-client/blob/faea440b27b37b69251414c69cc5e25151aa7154/src/BuildpackJob.js#L18-L31 "Source code on GitHub")

BuildpackJob class constructor.

**Parameters**

-   `manager` **DrayManager** {DrayManager} instance
-   `parameters` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** Parameters to set
-   `redisExpireIn` **\[[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)](default 600)** Expiration time in seconds for output stored in Redis

# addFiles

[src/BuildpackJob.js:46-49](https://github.com/spark/dray-client/blob/faea440b27b37b69251414c69cc5e25151aa7154/src/BuildpackJob.js#L46-L49 "Source code on GitHub")

Add files to the job.
Array should contain {Object}s with `filename` {String} and
`data` {Buffer} or {String} properties. I.e.:

job.addFiles([{
	filename: 'foo.ino',
	data: fs.readFileSync('foo.ino')
}]);

**Parameters**

-   `files` **[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)** Array of files to add

Returns **this** `this` object

# setBuildpacks

[src/BuildpackJob.js:58-62](https://github.com/spark/dray-client/blob/faea440b27b37b69251414c69cc5e25151aa7154/src/BuildpackJob.js#L58-L62 "Source code on GitHub")

Sets buildpacks to be used during compilation.
List will be appended by storing buildpack.

**Parameters**

-   `buildpacks` **[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)** {Array} of {String}s specifying Docker images

Returns **this** `this` object

# submit

[src/BuildpackJob.js:70-109](https://github.com/spark/dray-client/blob/faea440b27b37b69251414c69cc5e25151aa7154/src/BuildpackJob.js#L70-L109 "Source code on GitHub")

Submits job

**Parameters**

-   `timeout` **[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)** Job timeout in ms

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)** Will resolve when job finished.
