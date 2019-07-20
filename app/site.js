'use strict';

const express = require('express');

const slaConfig = process.env.SLA || "0/100";
const port = parseInt(process.env.PORT, 10)
const randomizedLatencyThreshold = parseInt(process.env.LATENCY || 0, 10);
// pre-calcs
const counterBase = parseInt(slaConfig.split("/")[1] || 100, 10);
const failBase = parseInt(slaConfig.split("/")[0] || 0, 10);
const sla = 100 - Math.ceil((failBase / counterBase) * 100);

console.log(`Service expected SLA: ${sla}% (faulty ${slaConfig})`)

// Constants
const HOST = '0.0.0.0';
const minLatency = 50; // 50ms

// App
const app = express();

function shuffle(array) {
  // shuffle an array
  let counter = array.length;
  while (counter > 0) {
    let index = Math.floor(Math.random() * counter);
    counter--;
    let temp = array[counter];
    array[counter] = array[index];
    array[index] = temp;
  }
  return array;
}

function genRequestsSequence(fail, base) {
  // generate shuffled sequence of request with failure/success flags
  let requests = [];
  for (var i = base, j = fail; i >= 0; i--, j--) {
    requests.push(j > 0 ? true : false);
  }
  return shuffle(requests);
}

// track SLA state here
var counter = 0;
var requests = null;

app.get('/', (req, res, next) => {
  if (requests && requests.length == counter + 1) counter = 0;
  if (counter == 0) requests = genRequestsSequence(failBase, counterBase);
  let latency = Math.ceil(Math.random() * (randomizedLatencyThreshold - minLatency) + minLatency);
  let latencyStr = randomizedLatencyThreshold > 0 ? latency + "ms" : "disabled";

  counter += 1;
  let fn = function () {
    if (requests[counter] == true) {
      next(new Error(`Failure at request #${counter} (out of ${counterBase}), random latency: ${latencyStr}`));
    } else {

      res.send(`Request #${counter}: ${failBase} of ${counterBase} will fail, SLA: ${sla}%, random latency: ${latencyStr}`);
    }
  };
  if (randomizedLatencyThreshold === 0) fn();
  else setTimeout(fn, latency);

});

app.listen(port, HOST);
console.log(`Running on http://${HOST}:${port}`);
