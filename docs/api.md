# listJobs

[src/DrayManager.js:37-44](https://github.com/spark/dray-client/blob/6f03f688ad2c02ef1197438ea25db6a5bbe2f3f5/src/DrayManager.js#L37-L44 "Source code on GitHub")

List submitted Dray jobs

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)** Resolves into {Array} of jobs

# stepsCompleted

[src/DrayJob.js:21-23](https://github.com/spark/dray-client/blob/6f03f688ad2c02ef1197438ea25db6a5bbe2f3f5/src/DrayJob.js#L21-L23 "Source code on GitHub")

Number of steps already completed

Returns **[Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)** number of completed steps

Returns **[undefined](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/undefined)** if first step hasn't finished yet

# status

[src/DrayJob.js:30-32](https://github.com/spark/dray-client/blob/6f03f688ad2c02ef1197438ea25db6a5bbe2f3f5/src/DrayJob.js#L30-L32 "Source code on GitHub")

Job status

Returns **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** 'running'|'error'|'complete'

# createdAt

[src/DrayJob.js:39-41](https://github.com/spark/dray-client/blob/6f03f688ad2c02ef1197438ea25db6a5bbe2f3f5/src/DrayJob.js#L39-L41 "Source code on GitHub")

Job creation date

Returns **[Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)** creation date

# finishedIn

[src/DrayJob.js:49-51](https://github.com/spark/dray-client/blob/6f03f688ad2c02ef1197438ea25db6a5bbe2f3f5/src/DrayJob.js#L49-L51 "Source code on GitHub")

Job finish date.

Returns **[Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)** job finish date

Returns **[undefined](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/undefined)** if job is still running

# logs

[src/DrayJob.js:58-60](https://github.com/spark/dray-client/blob/6f03f688ad2c02ef1197438ea25db6a5bbe2f3f5/src/DrayJob.js#L58-L60 "Source code on GitHub")

Get array of job logs

Returns **[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)** job logs

# setParameters

[src/DrayJob.js:68-71](https://github.com/spark/dray-client/blob/6f03f688ad2c02ef1197438ea25db6a5bbe2f3f5/src/DrayJob.js#L68-L71 "Source code on GitHub")

Set job parameters from passed object

**Parameters**

-   `parameters` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** One of the following: name, environment, input

Returns **this** this object

# setEnvironment

[src/DrayJob.js:78-80](https://github.com/spark/dray-client/blob/6f03f688ad2c02ef1197438ea25db6a5bbe2f3f5/src/DrayJob.js#L78-L80 "Source code on GitHub")

Set job environment shared between steps

**Parameters**

-   `env` **[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)** Array of environment variables

# addStep

[src/DrayJob.js:88-91](https://github.com/spark/dray-client/blob/6f03f688ad2c02ef1197438ea25db6a5bbe2f3f5/src/DrayJob.js#L88-L91 "Source code on GitHub")

Add single job step

**Parameters**

-   `step` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** Dray step definition

Returns **this** this object

# submit

[src/DrayJob.js:99-118](https://github.com/spark/dray-client/blob/6f03f688ad2c02ef1197438ea25db6a5bbe2f3f5/src/DrayJob.js#L99-L118 "Source code on GitHub")

Submit job for execution

**Parameters**

-   `timeout` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** (optional) Timeout in ms

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)** Resolved when job succeeds and rejected if fails

# toJSON

[src/DrayJob.js:125-139](https://github.com/spark/dray-client/blob/6f03f688ad2c02ef1197438ea25db6a5bbe2f3f5/src/DrayJob.js#L125-L139 "Source code on GitHub")

Serialize job to Dray format

Returns **[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** Job JSON

# destroy

[src/DrayJob.js:146-148](https://github.com/spark/dray-client/blob/6f03f688ad2c02ef1197438ea25db6a5bbe2f3f5/src/DrayJob.js#L146-L148 "Source code on GitHub")

Destroy job in Dray

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)** Resolved once job is destroyed
