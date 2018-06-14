# Plugin interface

# Base plugin

All plugins should be a ES6 JS class, and are required to have a `metadata` object that gets passed to the `super(metadata, defaultSettings)`.  The basis for a plugin should look similar to the following:

```js
const Plugin = require('../../plugin_handler/base');

class ShowRssSource extends Plugin {
  constructor() {
    const metadata = {
      pluginId: 'info_showrss',                 // Unique ID of plugin
      pluginName: 'ShowRss',                    // Display name of plugin
      pluginTypes: ['source', 'series'],         // 'source', 'downloader', 'player'
      sourceType: 'continuous',                 // 'adhoc', 'continuous'
      requires: ['com_flexget', 'com_transmissionbt'],  // this plugin requires the flexget plugin
      link: 'http://showrss.info/',             // Link to provider site
      description: 'Updated feed of TV shows'   // Description of plugin provider
    };
  
    const defaultSettings = {
      enabled: true
    };
  
    super(metadata, defaultSettings);
  }
}
```


## PluginTypes

A plugin can be a combination of any `pluginTypes` as long as they meet all of the requirements described below, and in the [Required plugin-specific functions](#Required-plugin-specific-functions) section.

The current possible values are as follows:

- `trending` - intended to return info about what is currently trending in the world
- `source` - goes out to a external source and runs a media search against that source
- `downloader` - a plugin that will provide a method to get data from a source
- `player` - a media player used to consume the media

## SourceTypes

If the pluginType is set to `source`, you can also provide the additional metadata about **how** the data should be retrieved:

- `adhoc` - one time media download
- `continuous` - this is a source that you can search upon, and when a download is requested, will download over time using the `series` endpoints

## Provided helpers

There are a few things that each plugin object gets when it's created, in order to easily access these global constructs:

```js
this.events // reference to global event emitter for the entire api. events described below
this.config // reference to global config
this.logger // usable logger with `info`, `debug`, `error`, etc methods
```


## Events

Currently defined events in kapture:

- `continuous:added` - a continuous source has had a new entry added. entry detail in first argument

Not yet added:

- `continuous:removed` -
- `search:query` - 
- `download:started` -
- `download:completed` -
- `download:removed` -

# Required plugin-specific functions

**All data methods described below should return a `Promise` with the resultant data**

## Search source plugin

#### Metadata

Must have: 

- `pluginTypes`: `source` must be present
- `sourceTypes`: can be `continuous` or `adhoc`

#### Functions

- `search(query)` - searches the source repository for string `query` and returns a collection of results that the source provides.

#### Output

```json
{}
```


## Downloader plugins

The downloader plugins are a bit unique to the system, in that they need to store data about the current state of their downloads somewhere.  The `pluginStateStore` is provided for that purpose.  See the `youtube` plugin for an example of how that is used.

#### Metadata 

Must have:

- `pluginType` contains `downloader` (either array or string)
- `downloadProviders` must contain a string that this plugin can perform downloads for

#### Functions

- `downloadSlug(slug)` - starts a new download of given `slug` identifier (usually provided by the search results defined by a `source` plugin).  Returns a `Promise` with success or failure to add that download. **Do not block**, use the `status` function to report progress.  This will be called via the `downloads/method:{methodId}/{slug}` approach.
- `downloadId(id)` - starts a new download of a source-defined id.  this will be called by the `downloads/source:{sourceId}/{id}` method
- `status()` - returns a `Promise` with the data (an array) about all of the current and active downloads.  
- `status(id)` - provides info about a specific download ID (id defined by the plugin itself - could be either the id of the search result, or some hash as long as it's unique).
- `removeId(id, deleteFromDisk)` - stops active downloads, or removes complete ones.  In the case of `deleteFromDisk` boolean is set - this function should also remove the file from disk
- `removeSlug(slug, deleteFromDisk)` - 

#### Output


## Trending plugins

#### Metadata

Must have the `trending` sourceType 

#### Functions 

The plugin must also provide the following functions:

- `trending()` - provides a kapture-formatted object (see below) that will be aggregated with other providers in response to query
- `trendingInfo(id)` - provides information about a specific entry (denoted by trending object field `id`)

#### Output

The standard trending json object should look something like this (written in yaml for easy reading):

```yaml
series:
  - score: 68               # how popular on a scale of 1-100
    sourceId: 'trakt'       # id of source provider
    id: 1611                # id of media entry (specific to source provider)
    type: 'series'          # kapture-media type
    title: 'Supernatural'   # display name
    slug: 'supernatural'    # slug used for whatever is desired
    additionalInfoUrl: 'https://trakt.tv/shows/supernatural'
movies:
  # ...
# other kapture-media-types
```

## Url downloader plugins

Certain sites may need their own approach to downloading content from the site (ie youtube).  As a result, the `com_kapture_url` plugin provides a method for handling a `http.*` url in the `q` string to search.  It searches other plugins for the functions below and if found, will pass to the `url` function of that plugin

#### Functions

- `urlMatches(url)` - this is a function that returns true/false depending on if the `url` passed can handle the url given
- `url(url)`  - will take a url and start a download on it.  this may just call the download function for ease of use
