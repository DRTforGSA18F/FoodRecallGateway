'use strict';
var LIVERELOAD_PORT = 35730;
var SERVER_PORT = 9001;
var lrSnippet = require('connect-livereload')({
    port: LIVERELOAD_PORT
});
var mountFolder = function(connect, dir) {
    return connect.static(require('path').resolve(dir));
};
var proxySnippet = require('grunt-connect-proxy/lib/utils').proxyRequest;

module.exports = function(grunt) {
    // show elapsed time at the end
    require('time-grunt')(grunt);
    // load all grunt tasks
    require('load-grunt-tasks')(grunt);

    // configurable paths
    var yeomanConfig = {
        app: 'app',
        dist: 'dist',
        cwd: process.cwd()
    };

    grunt.initConfig({
        yeoman: yeomanConfig,
        watch: {
            options: {
                nospawn: true,
                livereload: false
            },
            sass: {
                files: ['<%= yeoman.app %>/styles/**/*.{scss,sass}', '<%= yeoman.app %>/styles/_partials/**/*.{scss,sass}'],
                tasks: ['sass']
            },
            livereload: {
                options: {
                    livereload: grunt.option('livereloadport') || LIVERELOAD_PORT
                },
                files: [
                    '<%= yeoman.app %>/*.html',
                    '{.tmp,<%= yeoman.app %>}/styles/**/*.css',
                    '{.tmp,<%= yeoman.app %>}/scripts/**/*.js',
                    '<%= yeoman.app %>/images/**/*.{png,jpg,jpeg,gif,webp}',
                    'test/spec/**/*.js'
                ]
            }
        },
        sass: {
            dev: {
                files: {
                    '<%= yeoman.app %>/styles/main.css': '<%= yeoman.app %>/styles/main.scss'
                }
            }
        },
        connect: {
            options: {
                port: SERVER_PORT,
                // change this to '0.0.0.0' to access the server from outside
                hostname: 'localhost'
            },
            proxies: [{
                context: '/services', // the context of the data service
                host: 'farmersmarketapi.herokuapp.com', // wherever the data service is running
                port: 80
            }],
            livereload: {
                options: {
                    open: true,
                    base: 'app',
                    middleware: function(connect, options) {
                        var middlewares = [];

                        if (!Array.isArray(options.base)) {
                            options.base = [options.base];
                        }

                        // Setup the proxy
                        middlewares.push(require('grunt-connect-proxy/lib/utils').proxyRequest);

                        // Serve static files
                        options.base.forEach(function(base) {
                            middlewares.push(connect.static(base));
                        });

                        return middlewares;
                    }
                }
            },
            dist: {
                options: {
                    open: true,
                    base: 'dist',
                    middleware: function(connect, options) {
                        var middlewares = [];

                        if (!Array.isArray(options.base)) {
                            options.base = [options.base];
                        }

                        // Setup the proxy
                        middlewares.push(require('grunt-connect-proxy/lib/utils').proxyRequest);

                        // Serve static files
                        options.base.forEach(function(base) {
                            middlewares.push(connect.static(base));
                        });

                        return middlewares;
                    }
                }
            }
        },

        open: {
            server: {
                path: 'http://localhost:<%= connect.options.port %>'
            }
        },

        clean: {
            dist: ['.tmp', '<%= yeoman.dist %>/*'],
            server: '.tmp'
        },

        jshint: {
            options: {
                jshintrc: '.jshintrc',
                reporter: require('jshint-stylish')
            },
            jenkins: {
                options: {
                    reporter: 'checkstyle',
                    reporterOutput: 'results/js_violations.xml',
                    force: true
                },
                files: {
                    src: [
                        'Gruntfile.js',
                        '/scripts/{,*/}*.js',
                        '!/scripts/vendor/*',
                        'test/spec/{,*/}*.js'
                    ]
                },
            },
            default: [
                'Gruntfile.js',
                '/scripts/{,*/}*.js',
                '!/scripts/vendor/*',
                'test/spec/{,*/}*.js'
            ]
        },

        // Dependency loader configuration provided by requirejs
        requirejs: {
            dist: {
                // Options: https://github.com/jrburke/r.js/blob/master/build/example.build.js
                options: {
                    // `name` and `out` is set by grunt-usemin
                    baseUrl: yeomanConfig.app + '/scripts',
                    optimize: 'none',
                    preserveLicenseComments: false,
                    findNestedDependencies: true,
                    useStrict: true,
                    wrap: true,
                    //temp
                    name: 'main',
                    out: 'dist\\scripts\\main.js',
                    mainConfigFile: 'app/scripts/config/config.js',
                    include: ['main']
                    //uglify2: {} // https://github.com/mishoo/UglifyJS2
                }
            }
        },

        // Unit testing is provided by Karma, Jasmine and Istanbul
        karma: {
            options: {
                basePath: process.cwd(),
                singleRun: true,
                captureTimeout: 7000,
                autoWatch: true,
                logLevel: 'ERROR',
                // junit is used by Jenkins plugin
                reporters: ['dots', 'coverage', 'junit'],
                browsers: ['PhantomJS'], //PhantomJS, Chrome
                junitReporter: {
                    outputFile: 'test/test-results.xml'
                },

                // Change this to the framework you want to use.
                frameworks: ['jasmine'],

                plugins: [
                    'karma-jasmine',
                    'karma-phantomjs-launcher',
                    'karma-chrome-launcher',
                    'karma-coverage'
                ],

                preprocessors: {
                    'app/scripts/**/*.js': 'coverage'
                },
                coverageReporter: {
                    type: 'lcov',
                    dir: 'test/coverage'
                },

                files: [
                    // You can optionally remove this or swap out for a different expect.
                    'app/vendor/requirejs/require.js',
                    'test/runner.js', {
                        pattern: 'app/vendor/**/*.*',
                        included: false
                    }, {
                        pattern: 'app/scripts/**/*.*',
                        included: false
                    },
                    // Derives test framework from Karma configuration.
                    {
                        pattern: 'test/<%= karma.options.frameworks[0] %>/**/*.spec.js',
                        included: false
                    }
                ],
                exclude: ['app/scripts/main.js']
            },

            // This creates a server that will automatically run your tests when you
            // save a file and display results in the terminal.
            daemon: {
                options: {
                    singleRun: false
                }
            },

            // This is useful for running the tests just once.
            run: {
                options: {
                    singleRun: true
                }
            },


            coveralls: {
                options: {
                    coverage_dir: 'test/coverage/'
                }
            }
        },

        modernizr: {

            // Path to the build you're using for development.
            "devFile": "<%= yeoman.app %>/vendor/modernizr/modernizr.js",

            // Path to save out the built file.
            "outputFile": "<%= yeoman.dist %>/scripts/modernizr.js",

            // Based on default settings on http://modernizr.com/download/
            "extra": {
                "shiv": true,
                "printshiv": false,
                "load": true,
                "mq": false,
                "cssclasses": true
            },

            // Based on default settings on http://modernizr.com/download/
            "extensibility": {
                "addtest": false,
                "prefixed": false,
                "teststyles": false,
                "testprops": false,
                "testallprops": false,
                "hasevents": false,
                "prefixes": false,
                "domprefixes": false
            },

            // By default, source is uglified before saving
            "uglify": true,

            // Define any tests you want to impliticly include.
            "tests": [],

            // By default, this task will crawl your project for references to Modernizr tests.
            // Set to false to disable.
            "parseFiles": true,

            // When parseFiles = true, this task will crawl all *.js, *.css, *.scss files, except files that are in node_modules/.
            // You can override this by defining a "files" array below.
            // "files" : [],

            // When parseFiles = true, matchCommunityTests = true will attempt to
            // match user-contributed tests.
            "matchCommunityTests": false,

            // Have custom Modernizr tests? Add paths to their location here.
            "customTests": []
        },


        useminPrepare: {
            html: '<%= yeoman.app %>/index.html',
            options: {
                dest: '<%= yeoman.dist %>'
            }
        },

        usemin: {
            html: ['<%= yeoman.dist %>/**/*.html'],
            css: ['<%= yeoman.dist %>/styles/**/*.css'],
            options: {
                dirs: ['<%= yeoman.dist %>'],
                assetsDirs: 'images',
                patterns: {
                    js: [
                        [/(image\.png)/, 'Replacing reference to image.png']
                    ]
                }
            }
        },

        imagemin: {
            dist: {
                files: [{
                    expand: true,
                    cwd: '<%= yeoman.app %>/images',
                    src: '**/*.{png,jpg,jpeg}',
                    dest: '<%= yeoman.dist %>/images'
                }]
            }
        },
        cssmin: {
            dist: {
                files: {
                    '<%= yeoman.dist %>/styles/main.css': [
                        '.tmp/styles/**/*.css',
                        '<%= yeoman.app %>/styles/**/*.css'
                    ]
                }
            }
        },

        copy: {
            dist: {
                files: [{
                    expand: true,
                    dot: true,
                    cwd: '<%= yeoman.app %>',
                    dest: '<%= yeoman.dist %>',
                    src: [
                        '*.{ico,txt}',
                        '.htaccess',
                        'images/**/*.{png,jpg,jpeg,gif,webp}',
                        'fonts/**/*.*',
                        './*.html',
                        'vendor/**/*.{woff,svg,ttf,eot}',
                        'vendor/**/*.{png,jpg,jpeg,gif,webp}'
                    ]
                }]
            },
            assets: {
                files: [{
                    expand: true,
                    cwd: '<%= yeoman.cwd %>/app/bower_components/globalassets',
                    src: ['**'],
                    dest: 'app/vendor/globalassets'
                }, {
                    expand: true,
                    cwd: '<%= yeoman.cwd %>/app/bower_components/emptyassets',
                    src: ['**'],
                    dest: 'app/vendor/emptyassets'
                }]
            }
        },
        bower: {
            install: {
                options: {
                    targetDir: 'app/vendor',
                    layout: 'byComponent',
                    install: true,
                    verbose: false,
                    cleanTargetDir: false,
                    cleanBowerDir: false,
                    bowerOptions: {}
                }
            },
            options: {
                exclude: ['modernizr']
            },
            all: {
                rjsConfig: '<%= yeoman.app %>/scripts/main.js'
            }
        },

        plato: {
            run: {
                files: {
                    'report': ['app/scripts/**/*.js', 'test/jasmine/**/*.js'],
                }
            },
        },

        docco: {
            run: {
                src: ['app/scripts/**/*.js', 'test/jasmine/**/*.js'],
                options: {
                    output: 'docs/'
                }
            }
        },

        rev: {
            dist: {
                files: {
                    src: [
                        '<%= yeoman.dist %>/scripts/**/*.js',
                        '<%= yeoman.dist %>/styles/**/*.css',
                        //'<%= yeoman.dist %>/images/**/*.{png,jpg,jpeg,gif,webp}',
                        //'<%= yeoman.dist %>/styles/fonts/**/*.*',
                    ]
                }
            }
        }
    });

    grunt.registerTask('serve', function(target) {
        if (target === 'dist') {
            return grunt.task.run([
                'build',
                'open:server',
                'configureProxies:server',
                'connect:dist:keepalive'
            ]);
        }

        grunt.task.run([
            'clean:server',
            'sass',
            'configureProxies:server',
            'connect:livereload',
            'watch'
        ]);
    });

    grunt.registerTask('build', [
        'clean:dist',
        'sass',
        'useminPrepare',
        'requirejs',
        //'imagemin',
        'concat',
        'cssmin',
        'uglify',
        'copy:dist',
        'rev',
        'usemin'
    ]);

    grunt.registerTask('init', [
        'bower:install', 'copy:assets', 'serve'
    ]);

    grunt.registerTask('unit:test', function(target) {
        if (target === 'keepalive') {
            return grunt.task.run([
                'karma:daemon'
            ]);
        } else {
            return grunt.task.run([
                'karma:run'
            ]);
        }
    });

    grunt.registerTask('static:analysis', [
        'plato'
    ]);

    grunt.registerTask('self:document', [
        'docco'
    ]);

    grunt.registerTask('default', [
        'jshint',
        'unit:test',
        'build'
    ]);

    grunt.registerTask('jenkins', [
        'assets',
        'jshint',
        'unit:test',
        'build'
    ]);

};