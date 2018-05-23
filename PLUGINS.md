# Plugin interface

# Base plugin

All plugins entrypoints should be a class, and are required to have a `metadata` object that looks similar to the following:

```js
var ShowRssSource = function (options) {
  this.metadata = {
    pluginId: 'info_showrss',                         // Unique ID of plugin
    pluginName: 'ShowRss',                            // Display name of plugin
    pluginTypes: ['source'],                          // 'source', 'downloader', 'player', 'trending'

    // additional info about plugin
    link: 'http://showrss.info/',                     // Link to provider site
    description: 'Updated feed of TV shows'           // Description of plugin provider

    // in the case of a 'source' plugin
    sourceType: 'continuous',                         // 'adhoc', 'continuous'

    // in the case of a 'downloader' plugin
    // downloadProviders: 'torrent',                  // any method of download this plugin can handle

    // optional - ensures other plugins are also enabled
    requires: ['com_flexget', 'com_transmissionbt'],  // this plugin requires the flexget plugin
  };

  // a object that will be used to store default settings and will be set
  // in the user settings if not present
  this.defaultSettings = {
    enabled: true
  };
  

  ShowRssSource.super_.apply(this, arguments);

  return this;
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


# Required plugin-specific functions

**All data methods described below should return a `Promise` with the resultant data**

## Trending plugins

Must have the `trending` sourceType and the following functions:

- `trending()` - provides a kapture-formatted object (see below) that will be aggregated with other providers in response to query
- `trendingInfo(id)` - provides information about a specific entry (denoted by trending object field `id`)

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
