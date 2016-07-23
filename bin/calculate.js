#!/usr/bin/env node

var program = require('commander'),
    lcc = require('lc-client');

console.error("Calculates basic statistics on top of the iRail knowledge graph. Use --help to discover more functions");

//1. Instantiate a fetcher
var concurrentRequests = 10,
    enableCache = true,
    http = new lcc.HttpFetcher(concurrentRequests, enableCache),
    fetcher = new lcc.Fetcher({"entrypoints" : ["http://graph.spitsgids.be/"]}, http);

//prepare counting variables
var numberOfConnections = 0,
    throughBrussels = 0,
    brusselsStations = [
      'http://irail.be/stations/NMBS/008813003', //Central
      'http://irail.be/stations/NMBS/008813045', //Congres
      'http://irail.be/stations/NMBS/008813037', //Kapellekerk
      'http://irail.be/stations/NMBS/008811304', //Luxemburg
      'http://irail.be/stations/NMBS/008819406', //Airport
      'http://irail.be/stations/NMBS/008812005', //North
      'http://irail.be/stations/NMBS/008811916', //Schuman
      'http://irail.be/stations/NMBS/008815040', //West
      'http://irail.be/stations/NMBS/008814001'  //South
    ];

//2. Use an empty query to get all connections from the sources configured in the fetcher
fetcher.buildConnectionsStream({departureTime: new Date('2016-07-25T05:00Z')}, function (connectionsStream) {
  connectionsStream.on('data', function (connection) {
    // output a dot each 100 connections that are processed)
    if (numberOfConnections%100 === 0)
      process.stdout.write('.');

    //stop condition
    if ((connection.departureTime - new Date('2016-07-25T22:00Z')) > 0) {
      fetcher.close(); // otherwise it keeps running forever, or it stops at an empty page (this behaviour will/should however disappear: https://github.com/linkedconnections/client.js/issues/17)
    }
    
    //** Let's do something with the connection now **//
    // → Count connections
    numberOfConnections++;
    // → Check whether it's a brussels station
    if (brusselsStations.indexOf(connection.arrivalStop) > -1 || brusselsStations.indexOf(connection.departureStop) > -1) {
      throughBrussels++;
    }
  });

  //do something when the stop condition is read and the last connection is processed
  connectionsStream.on('end', function () {
    console.log(throughBrussels/numberOfConnections*100 + '% of all train traffic on 25th of July happens in Brussels');
  });
});
