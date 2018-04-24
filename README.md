# Lokun
Lokun (Icelandic for 'shutdown') is a simple Google Cloud function to manage compute instances using a configured schedule.

## Getting started

### Configuring your compute instance
1. Go to your compute instance in [Google Cloud Console](https://console.cloud.google.com/compute/instances) and edit it
1. Add a network tag `auto-shutdown`
1. Configure the start/end time by adding a `start-time` and `stop-time` key/value to the custom metadata section. Times are in the `HH:mm` format and UTC-based. 
1. If you want to configure different machine types on a daily basis, add a `machineType-{day}` key/value to the custom metadata section. When starting a machine, it will resize it if a different machine type is configured for that day. When no specific machine type is configured for that day, it will keep the same machine type.
    1. Use the 3-letter word for days: `mon`, `tue`, `wed`, `thu`, `fri`, `sat` and `sun`
    1. Use the machine types specified here: https://cloud.google.com/compute/docs/machine-types

An example configuration may look like:

<img src="https://user-images.githubusercontent.com/1521207/39186939-318090e2-47cc-11e8-8aad-ab3994ccab89.png" alt="Google Cloud config" width="450">

This configuration results in the following schedule:
- Monday: a `g1-small` machine
- Tuesday till thursday: an `n1-standard-1` machine
- Friday: a `g1-small` machine
- Saturday and sunday: an `f1-micro` machine

### Creating a function
1. Go to the [Google Cloud Console](https://console.cloud.google.com)
1. Create a [new Cloud Function](https://console.cloud.google.com/functions/)
1. Give it a name, such as `checkGcpInstances`
1. Choose 128MB memory
1. Choose your function trigger (HTTP for example)
1. Choose 'Inline editor'
1. Grab [index.js](https://github.com/webenablebv/Lokun/blob/master/src/index.js) and [package.json](https://github.com/webenablebv/Lokun/blob/master/) and copy-paste these into the corresponding editors
1. Use `checkGcpInstances` as function name to execute
1. Deploy your function and execute a test request


### Triggering your function
Depending on your cloud function configuration you need to trigger the function at some interval. Google Cloud Functions provides different trigger mechanisms such as HTTP triggers, Cloud Pub/Sub and Cloud Storage buckets. When using an HTTP trigger you could configure an HTTP uptime/ping tool to call the function with an interval.

By default the Google Cloud project ID will be detected from the platform. You can also specify the project ID in the request body using the following payload:

```json
{ "project": "PROJECT_ID" }
```

Authentication settings will also be detected from the platform.