const { WebdriverIOConfig } = require('@serenity-js/webdriverio');
const { ArtifactArchiver } = require('@serenity-js/core');

exports.config = {
    framework: '@serenity-js/webdriverio',
    
    // Test files
    specs: [
        './features/**/*.feature',
    ],

    // Target application
    baseUrl: 'http://localhost:5173',

    // Browser capabilities
    capabilities: [{
        browserName: 'chrome',
        'goog:chromeOptions': {
            args: [
                '--headless',
                '--disable-gpu',
                '--window-size=1920,1080'
            ]
        }
    }],

    // Framework specific configuration
    serenity: {
        runner: 'cucumber',
        crew: [
            ArtifactArchiver.storingArtifactsAt('./target/site/serenity'),
            '@serenity-js/console-reporter',
            ['@serenity-js/serenity-bdd', { specDirectory: './features' }]
        ]
    },

    cucumberOpts: {
        require: [
            './step_definitions/**/*.js'
        ],
        format: [], // Handled by Serenity
        timeout: 60000,
    },
    
    logLevel: 'error',
};
