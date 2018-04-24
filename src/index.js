const Compute = require('@google-cloud/compute');

exports.checkGcpInstances = (req, res) => {
  const project = req.body.project || process.env.GCLOUD_PROJECT;
  if (!project) {
    console.error("'project' is missing from request body or environment variables");
    res.status(400).send('PROJECT MISSING');
    return;
  }

  console.log('Starting GCE management job for project', project);

  const compute = new Compute();

  compute.getVMs(null, (err, vms) => {
    if (err) {
      console.error('Error: ', err);
      return res.status(500).send('ERROR');
    }

    var now = new Date();
    var nowMinutes = getMinutesNow();

    console.log('Received', vms.length, 'VM(s)');
    for (var i = 0; i < vms.length; i++) {
      try {
        const vm = vms[i];
        var metadata = vm.metadata;

        // Check for a network tag 'auto-shutdown'
        if (metadata.tags.items.indexOf('auto-shutdown') > -1) {
          // Resolve the start/stop time from the VM metadata and calculate the time in minutes
          var startMins = getMinutes(getMetadataByKey(metadata.metadata.items, 'start-time'));
          var stopMins = getMinutes(getMetadataByKey(metadata.metadata.items, 'stop-time'));
          console.log('VM (', metadata.status, ') start at', startMins, 'and stop at', stopMins, 'current time:', nowMinutes);

          if (metadata.status !== 'RUNNING') {
            // Machine is not running - should it be started?
            const shouldRun = nowMinutes >= startMins && nowMinutes < stopMins;
            console.log('VM', vm.name, 'is', metadata.status, 'should start:', shouldRun);

            if (shouldRun) {
              // Determine if a specific machine type is configured for this day
              var dayName = getDayName(now);
              var machineType = getMetadataByKey(metadata.metadata.items, 'machineType-' + dayName);
              console.log('Machine type for', dayName, ':', machineType);

              var currMachineTime = metadata.machineType.substring(metadata.machineType.lastIndexOf('/') + 1);
              if (machineType && currMachineTime != machineType) {
                // Resize the machine to the desired type
                // This also starts the VM
                vm.resize(machineType, { start: true }, data => {
                  console.log('Resized machine from', currMachineTime, 'to', machineType);
                });
              }
              else {
                // Just start the VM with the current configuration
                vm.start().then(data => {
                  console.log('Started VM ', vm.name);
                });
              }
            }
          }
          else if (metadata.status === 'PROVISIONING') {
            // Skip VMs which are already provsioning a new instance
            continue;
          }
          else {
            // Machine is already running - should it be shutdown?

            const shouldShutdown = nowMinutes < startMins || nowMinutes >= stopMins;
            console.log('VM ', vm.name, ' is ', metadata.status, ' should stop: ', shouldShutdown);
            if (shouldShutdown) {
              vm.stop().then(data => {
                console.log('Stopped VM ', vm.name);
              });
            }
          }
        }
      }
      catch (e) {
        console.log('Error occured while executing function', e);
        return res.status(500).send('ERROR');
      }
    }
  });

  res.status(200).send('OK');
};

function getDayName(date) {
  var days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  return days[date.getDay()];

}
function getMetadataByKey(arr, key) {
  for (let i = 0; i < arr.length; i++) {
    const item = arr[i];
    if (item.key === key) {
      return item.value;
    }
  }

  return null;
}

function getMinutesNow() {
  var timeNow = new Date();
  return timeNow.getHours() * 60 + timeNow.getMinutes();
}

function getMinutes(str) {
  var time = str.split(':');
  return time[0] * 60 + time[1] * 1;
}
