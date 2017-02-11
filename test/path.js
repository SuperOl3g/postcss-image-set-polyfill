var expect  = require('chai').expect;

var postcss = require('postcss');
var imageSet = require('../');

var input =
    'a {' +
        'background-image: image-set(' +
        '"img/test.png" 1x,' +
        '"img/test-2x.png" 2x,' +
        '"my-img-print.png" 600dpi' +
        ');' +
    '}';

var test = function (input, output, opts, done) {
    expect(postcss(imageSet).process(input).css.replace(/[ \n]/g, '')).to.eql(output.replace(/[ \n]/g, ''));
    done();
};

describe('postcss-image-set', function () {
    it('parses the image-set w/o url', function (done) {

        var output =
            'a {' +
                'background-image: url("img/test.png");' +
            '}' +

            '@media (min-resolution: 144dpi){' +
                'a{' +
                    'background-image: url("img/test-2x.png");' +
                    '}' +
                '}' +

            '@media (min-resolution: 600dpi){' +
                'a{' +
                    'background-image: url("my-img-print.png");' +
                    '}' +
                '}';

        test(input, output, {}, done);
    });
});
