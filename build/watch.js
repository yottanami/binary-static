module.exports = {
    css: {
        files: ['src/sass/**/*.scss'],
        tasks: ['css']
    },
    js: {
        files: ['src/javascript/**/*.js'],
        tasks: ['js']
    },
    templates: {
        files: ['src/templates/**/*.*'],
        tasks: ['copy']
    },
    options: {
        spawn: false,
        interrupt: true,
        debounceDelay: 250
    }
};
