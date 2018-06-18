# Kapture API server

[![Build Status](https://travis-ci.org/kapturebox/server.svg?branch=master)](https://travis-ci.org/kapturebox/server)

> This is the backend for the kapture server (API)


# Quickstart with Docker

To get the entire system up and running, the quickest way is to use the docker build:

```bash
docker-compose up
```

This will get you a fully working kapture server installation (with dependent services) in docker that you can access via [localhost:9000](localhost:9000).  See the [API documentation](http://kapture.docs.stoplight.io) on how to properly use it.

# Local Development

Easiest way to get up and running here is to start up a local server:

```
yarn
npm start 
# or
npm run watch # to reload on changes to local files
```

Then connect to http://localhost:9000



# API

[The entire API spec is well documented here](http://kapture.docs.stoplight.io)
