module.exports = {
    all: {
        options: {
            jshintrc: true,
            ignores: ['src/javascript/lib/**/*.js',
                      'src/javascript/binary/pages/wstrade.js' // unreasonable and wrong jshint issues here
                     ]
        },
        src: 'src/javascript/**/*.js'
    }
};
