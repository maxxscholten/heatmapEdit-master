module.exports = function(grunt) {
  require('load-grunt-tasks')(grunt);

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-typescript');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.initConfig({
    clean: ['dist'],

    copy: {
      dist_js: {
        expand: true,
        cwd: 'src',
        src: ['**/*.ts', '**/*.d.ts', '**/*.js'],
        dest: 'dist'
      },
      dist_html: {
        expand: true,
        flatten: true,
        cwd: 'partials',
        src: ['*.html'],
        dest: 'dist/partials/'
      },
      dist_img: {
        expand: true,
        flatten: true,
        cwd: 'img',
        src: ['*.*'],
        dest: 'dist/img/'
      },
      dist_statics: {
        expand: true,
        flatten: true,
        src: ['plugin.json', 'README.md'],
        dest: 'dist/'
      }
    },

    typescript: {
      build: {
        src: ['dist/*.ts', '!**/*.d.ts'],
        dest: 'dist',
        options: {
          module: 'system',
          target: 'es5',
          rootDir: 'dist/',
          declaration: true,
          emitDecoratorMetadata: true,
          experimentalDecorators: true,
          sourceMap: true,
          noImplicitAny: false,
        }
      }
    },

    watch: {
      files: ['src/*.ts', 'partials/*.html', 'img/*.*', 'plugin.json', 'README.md'],
      tasks: ['default'],
      options: {
        debounceDelay: 250,
      },
    }
  });

  grunt.registerTask('default', [
    'clean',
    'copy:dist_js',
    'typescript:build',
    'copy:dist_html',
    'copy:dist_img',
    'copy:dist_statics'
  ]);
};