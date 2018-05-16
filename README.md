# Kapture API server

> This is the backend for the kapture server (API)

# Getting started

Easiest way to get up and running here is to start up a local server:

```
yarn
npm start 
# or
npm run watch # to reload on changes to local files
```

Then connect to http://localhost:9000



# API Design Notes

Initial thoughts on what the API should look like.  See [the official api spec](app/oas/main.oas2.yml) for the current implementation

```
/api/v1/series - get
/api/v1/series/{sourceId}/{entryId} - get / post / delete

/api/v1/downloads - get
/api/v1/downloads/source:{sourceId}/{slug} - post
/api/v1/downloads/method:{downloadMethod}/{slug} - post

/api/v1/settings - get
/api/v1/settings/{key} - get / put / post

/api/v1/search?q=search&filter="source:thepiratebay;"&start=

/api/v1/trending
/api/v1/trending?filter=type&sourceId=source

Eventually: both to return jwt
/api/v1/auth/oauth - endpoints for oauth
/api/v1/auth/basic - endpoints for basic auth
```
