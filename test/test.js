/* eslint-disable space-infix-ops */
var expect  = require('chai').expect;

var postcss = require('postcss');
var imageSet = require('../');

var test = function (input, output, opts, done) {
    expect(postcss(imageSet).process(input).css.replace(/[ \n]/g, '')).to.eql(output.replace(/[ \n]/g, ''));
    done();
};

describe('postcss-image-set', function () {
    it('parses the image-set', function (done) {
        test(
            'a{' +
                'background-image: image-set(' +
                    'url(img/test.png) 1x, ' +
                    'url(img/test-2x.png) 2x, ' +
                    'url(my-img-print.png) 600dpi' +
                ');' +
            '}',
            'a{' +
                'background-image: url(img/test.png); ' +
            '}' +
            '@media (screen and min-resolution: 2dppx){' +
                'a{' +
                    'background-image: url(img/test-2x.png);' +
                '}' +
            '}'+
            '@media (screen and min-resolution: 600dpi){' +
                'a{' +
                    'background-image: url(my-img-print.png);' +
                '}' +
            '}',
            { }, done);
    });

    it('parses the -webkit-image-set', function (done) {
        test(
            'a{' +
                'background-image: -webkit-image-set(' +
                    'url(img/test.png) 1x, ' +
                    'url(img/test-2x.png) 2x, ' +
                    'url(my-img-print.png) 600dpi' +
                ');' +
            '}',
            'a{' +
                'background-image: url(img/test.png); ' +
            '}' +
            '@media (screen and min-resolution: 2dppx){' +
                'a{' +
                    'background-image: url(img/test-2x.png);' +
                '}' +
            '}'+
            '@media (screen and min-resolution: 600dpi){' +
                'a{' +
                    'background-image: url(my-img-print.png);' +
                '}' +
            '}',
            { }, done);
    });
});
