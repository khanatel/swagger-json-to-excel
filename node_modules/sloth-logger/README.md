![Logo](https://raw.githubusercontent.com/natergj/sloth-logger/master/logo.png)
## Sloth Logger
A happy little logger with custom levels, colors, formats, output options and more

## Installation

    npm install sloth-logger


## Basic Usage
SlothLogger has 5 log types by default and the log level is set to show all logs. The default log types are:
error, warn, info, inspect, debug.

By default, logs are output to the console.

```javascript
var SlothLogger = require('sloth-logger');
var logger = new SlothLogger.Logger();

logger.error('Error Log Line');
logger.debug('Debug Log Line');
logger.info('Line with variable: %s', 'stringVar');
```
### Output

```bash
[ERROR][3/10/16 12:20:26 PM EST][log.js:47] Error Log Line
[DEBUG][3/10/16 12:20:26 PM EST][log.js:48] Debug Log Line
[INFO][3/10/16 12:59:26 PM EST][log.js:49] Line with variable: stringVar
```

## Setting properties of each log level
Each Log Level contains the following properties. New levels are created with these defaults

```javascript
'destination': process.stdout,
'dateFormat': 'm/dd/yy h:MM:ss TT Z',
'color': 'gray',
'sendEmail': false,
'inspect': false,
'inspectOptions': {},
'logLevelThreshold': 5,
'format': '${logLevelName}[${logDate}][${relativeFilePath}:${line}] ${logMessage}',
'aggregator': null  
```

destination: Takes an instance of an fs.WriteStream or a file path string   
dateFormat: Takes a date format. Uses [dateformat](https://www.npmjs.com/package/dateformat)   
color: Takes a color string. Uses [colors](https://www.npmjs.com/package/colors)   
sendEmail: Takes a Boolean. States whether individual log entries should be emailed   
inspect: Takes a Boolean. States whether to use util.inspect when printing log entry   
inspectOptions: Takes an [object](https://nodejs.org/dist/latest-v4.x/docs/api/util.html#util_util_inspect_object_options) to pass to the util.inspect function   
logLevelThreshold: Takes an integer. Log will only be handled if logLevelThreshold is less than or equal to logger's logLevel      
aggregator: Takes an Aggregator. If set, sendEmail option is ignored and emails are only sent when aggregotor.send() is called    
format: Takes and ES2015 template literal style string.   

#### Available options for format
fullFilePath: full path to file calling logger   
relativeFilePath: path to file relative to the process.cwd   
line: line of file calling logger   
logDate: formatting text string of date/time. Uses [dateformat](https://www.npmjs.com/package/dateformat)   
logLevelName: name of the log level (i.e. error, warn, etc) enclosed in []   
logMessage: formatted message   

These settings can be customized when a new SlotLogger is initialized or during runtime. 
#### Set at initialization

```javascript
let logger = new SlothLogger.Logger({
    levels: {
        info: {
            'destination': 'logs/info.log'
        },
        warn: {
            'destination': 'logs/warn.log'
        },
        crit: {
            'destination': process.stderr,
            'dateFormat': 'm/dd/yy h:MM:ss TT Z',
            'logLevelThreshold': 0
        }
    }
});
```
Note, that if you'd like to add a custom log level, simply add a new object keyed by the name of your new level. The above would create a new logger.crit() function with the specified adjustments to the default log level options.   
    
## Set logLevels on a per-file basis
If you're currently debugging a single file and wish to ignore your debug messages on other files, you can specify a custom log level on a per-file basis.   
To do this, you will need to set your logger as a global function

```javascript
var SlothLogger = require('../index.js');
global.logger = new SlothLogger.Logger({
	logLevel: 1
});
```

Then, at the top of the file that you are debugging, you will specify the log level to a higher number

```javascript
logger.setLogLevelForThisFile(4);
```

You can also change the logLevel at runtime if you are debugging a specific section of synchronous code

```javascript
var SlothLogger = require('../index.js');
global.logger = new SlothLogger.Logger({
	logLevel: 1
});

logger.debug('I will not print');
logger.logLevel = 5;
logger.debug('I will print now');
logger.logLevel = 1;
logger.debug('I will not print again');
```

    
## Send an email notification for each log item
By providing your logger with email settings, you can set each log type to send an email every time the logger is called.

SlothLogger uses [nodemailer](https://www.npmjs.com/package/nodemailer) for mailing. Options for nodemailer transport can be found in their documentation.

```javascript
var SlothLogger = require('sloth-logger');
var logger = new SlothLogger.Logger({
	emailSettings: {   
        from: 'noreply@mycompany.com',
        to: 'admin@mycompany.com',
        transportConfig: {
            host: 'smtp.mycompany.com',
            port: 25
        }
    }
});
logger.sendEmail('error', true);
```

## Set Log Email Aggregator
You can also set a log aggregator to collect log entries and send them in bulk. sendEmail attributes of log types are ignored if an aggregator is assigned. Log entries will always be emailed and they will only be emailed once send() has been called on the Aggregator.

```javascript
var SlothLogger = require('sloth-logger');
var logger = new SlothLogger.Logger({
	emailSettings: {   
        from: 'noreply@mycompany.com',
        to: 'admin@mycompany.com',
        subject: 'Error logs from server',
        transportConfig: {
            host: 'smtp.mycompany.com',
            port: 25
        }
    }
});

var aggregator = new SlothLogger.Aggregator({
    emailSettings: {   
        from: 'noreply@mycompany.com',
        to: 'admin@mycompany.com',
        subject: 'Aggregated logs from server',
        transportConfig: {
            host: 'smtp.mycompany.com',
            port: 25
        }
    }
});

logger.setLevelProps('error', { aggregator: aggregator });

logger.error('add this line to error log');
aggregator.send(function(err){
    if(err){
        console.error(err);
    }
});
```
