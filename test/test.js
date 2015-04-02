var postcss = require('postcss');
var expect  = require('chai').expect;

var imageSet = require('../');

var test = function (input, output, opts, done) {
    expect(postcss(imageSet).process(input).css).to.eql(output);
    done();
};

describe('postcss-image-set', function () {

    it('parses the image-set', function (done) {
        test('a{ background-image: image-set(' +
                                        'url(img/test.png) 1x, ' +
                                        'url(img/test-2x.png) 2x, ' +
                                        'url(my-img-print.png) 600dpi); }',
             'a{ background-image: url(img/test.png); ' +
                'background-image: image-set(' +
                                        'url(img/test.png) 1x, ' +
                                        'url(img/test-2x.png) 2x, ' +
                                        'url(my-img-print.png) 600dpi); }',
            { }, done);
    });

    it('parses the -webkit-image-set', function (done) {
        test('a{ background-image: -webkit-image-set(' +
                                        'url(img/test.png) 1x, ' +
                                        'url(img/test-2x.png) 2x, ' +
                                        'url(my-img-print.png) 600dpi); }',
             'a{ background-image: url(img/test.png); ' +
                'background-image: -webkit-image-set(' +
                                        'url(img/test.png) 1x, ' +
                                        'url(img/test-2x.png) 2x, ' +
                                        'url(my-img-print.png) 600dpi); }',
            { }, done);
    });
});
