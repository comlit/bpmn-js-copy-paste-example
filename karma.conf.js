const path = require('path');

// configures browsers to run test against
// any of [ 'ChromeHeadless', 'Chrome', 'Firefox' ]
const browsers = ['ChromeDebugging'];

// use puppeteer provided Chrome for testing
process.env.CHROME_BIN = require('puppeteer').executablePath();

const absoluteBasePath = path.resolve(__dirname);

const suite = 'test/copy-paste.js';

module.exports = function(karma) {
  karma.set({

    frameworks: [
      'mocha',
      'sinon-chai',
      'webpack'
    ],

    files: [
      suite
    ],

    preprocessors: {
      [suite]: [ 'webpack' ]
    },

    customLaunchers: {
      'ChromeDebugging': {
        base: 'Chrome',
        flags: [ '--remote-debugging-port=9333' ]
      }
    },

    browsers,

    singleRun: false,
    autoWatch: true,

    webpack: {
      mode: 'development',
      target: 'browserslist:last 2 versions, IE 11',
      module: {
        rules: [
          {
            test: /\.bpmn$/,
            type: 'asset/source'
          },
          {
            test: /\.css$/,
            type: 'asset/source'
          }
        ]
      },
      resolve: {
        mainFields: [
          'module',
          'main'
        ],
        modules: [
          'node_modules',
          absoluteBasePath
        ]
      },
      devtool: 'eval-source-map'
    }
  });

};