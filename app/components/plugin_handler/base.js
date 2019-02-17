

const persist = require('node-persist');
const util = require('util');
const path = require('path');
const events = require('../events');
const config = require('../../config');

const stateStorePath = config.get('pluginStateStore');

class Plugin {
  // constructor function for all plugins (After metadata has been set)
  constructor(metadata, defaultSettings) {
    if( !metadata )
      throw new Error('metadata must be provided to Plugin constructor')

    this.metadata = metadata;
    this.defaultSettings = defaultSettings || {'enabled': true};
    this.config = config;
    this.events = events;
    this.logger = config.logger;
    this.configKey = util.format('plugins.%s', this.metadata.pluginId);

    try {
      this.stateStore = persist.create({
        dir: path.join(stateStorePath, this.metadata.pluginId || 'base'),
        interval: 1000 // 1s save to disk interval
      });

      this.stateStore.initSync();
    } catch (err) {
      this.logger.error('unable to init state store: %s', err.toString());
    }

    // init default settings one by one if not already present
    for(var key of Object.keys(this.defaultSettings)) {
      var fullKeyName = this.configKey + '.' + key;
      var val = this.defaultSettings[key];

      if (this.config.getUserSetting(fullKeyName) !== undefined) {
        this.config.setUserSetting(fullKeyName, val);
      }
    }
  }

  /**
   * Returns all of the config values in an object
   */
  getAllSettings() {
    return this.config.getUserSetting(this.configKey);
  }

  /**
   * Gets a config value from the plugin config store
   * @param {String} key  the key to get
   */
  get(key) {
    const userKey = this.configKey + '.' + key;
    try {
      return this.config.getUserSetting(userKey);
    } catch (err) {
      return undefined;
    }
  }

  /**
   * Sets a config value in the plugin config store
   * @param {String} key       key of to set
   * @param {String} value     value to set key to
   */
  set(key, value) {
    const userKey = this.configKey + '.' + key;
    return this.config.setUserSetting(userKey, value);
  }

  /**
   * Set key in plugin state store to a specific value
   * @param {String} key             key to set
   * @param {Object, String} value   value to set it to
   */
  setState(key, value) {
    return this.stateStore.setItemSync(key, value);
  }

  /**
   * Get current value from statestore of key
   * @param {String} key  key to get
   */
  getState(key) {
    if (!key) { // then return array of all
      return this.stateStore.values();
    } else {
      return this.stateStore.getItemSync(key);
    }
  }

  /**
   * Removes a key from state store
   * @param {String} key key to remove from state store
   */
  removeState(key) {
    return this.stateStore.removeItemSync(key);
  }

  /**
   * Standard method to output string value of plugin item
   */
  toString() {
    return util.format('%s', this.metadata.pluginName);
  }

  /**
   * Returns true or false depending on whether the plugin is enabled or not
   */
  isEnabled() {
    return this.get('enabled') || false;
  }

  /**
   * Enable this plugin
   */
  enable() {
    return this.set('enabled', true);
  }

  /**
   * Disable current plugin
   */
  disable() {
    return this.set('enabled', false);
  }
}

module.exports = Plugin;
