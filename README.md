# Kapture API server

[![Build Status](https://travis-ci.org/kapturebox/server.svg?branch=master)](https://travis-ci.org/kapturebox/server)

> This is the backend API for the Kapture server


# Quickstart with Docker

To get the entire system up and running, the quickest way is to use the docker build:

```bash
docker-compose up
```

This will get you a fully working kapture server installation (with dependent services) in docker that you can access via [localhost:9000](localhost:9000).  See the [API documentation](http://kapture.docs.stoplight.io) on how to properly use it.

# Local Development

Easiest way to get up and running here is to start up a local server:

```bash
npm install
npm start
# or
npm run dist # to run the distribution version
```

Then connect to http://localhost:9000



# API

[The entire API spec is well documented here](https://kapture.docs.stoplight.io)


# Plugins to add

- https://www.flixgrab.com/ - to pull down Netflix content
