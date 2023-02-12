const {createLogger, format, transports} = require('winston');
const util = require('util');

const createMainLogger = () => {
  let logLevel = process.env.LOG_LEVEL || 'info';
  let logFormat = [format.splat(), format.simple(), format.timestamp()];

  if(process.env.NODE_ENV === 'development') {
    logLevel = 'debug';
    logFormat = [format.colorize(), ...logFormat]
  }

  console.log( util.format( 'environment: %s, log level: %s', process.env.NODE_ENV, logLevel ));

  const logger = createLogger({
    level: logLevel,
    format: format.combine(...logFormat),
    transports: new transports.Console()
  })
  return logger;
};

module.exports = createMainLogger;
