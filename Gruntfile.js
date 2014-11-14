module.exports = function(grunt) {

  grunt.initConfig({
/*    jasmine: {
      test: {
        options: {
          specs: 'build/test.js',
          outfile: 'build/test/SpecRunner.html'
        }
      } 
    }, */
    
    browserify: {
      release: {
        src: 'javascript/**/*.js',
        dest: 'build/main.js'
      },
      debug: {
        src: 'javascript/**/*.js',
        dest: 'build/main.js',
        options: {
          browserifyOptions: {
            debug: true
          }
        }
      }
    },
  
    watch: {
      scripts: {
        files: ['Gruntfile.js', 'javascript/**/*.js', 'spec/**/*.js'],
        tasks: ['browserify:debug'],
        options: {
          spawn: false,
        },
      },
    },
    
  });
  
 // grunt.loadNpmTasks('grunt-contrib-jasmine');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-watch');
 // grunt.loadNpmTasks('grunt-shell');
  
//  grunt.registerTask('spec', ['browserify:debug', 'jasmine']);
//  grunt.registerTask('spec:debug', ['browserify:debug', 'jasmine:test:build', 'shell:openRunner']);
  grunt.registerTask('build', ['browserify:release']);
  
};
