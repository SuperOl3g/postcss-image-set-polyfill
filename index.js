var postcss = require('postcss');

// get the list of images
var extractList = function (decl) {
    var stripped = decl.value.replace(/(\r\n|\n)/g, '');
    var inside   = stripped.match(/image-set\(([\s\S]+)\)/)[1];
    return postcss.list.comma(inside);
};

// get the size of image
var extractSize = function (image) {
    var l = postcss.list.space(image);
    if (l.length === 1) {
        return '1x';
    } else {
        return l[1];
    }
};

// get the url of an image
var extractUrl = function (image) {
    var url = postcss.list.space(image)[0];
    if ( url.match(/url\(/) || url.match(/image\(/) ) {
        return url;
    } else {
        return 'url(' + url + ')';
    }
};

// split url and size
var split = function (image) {
    return {
      size: extractSize(image)
    , url:  extractUrl(image)
    };
};

// get the default image
var getDefault = function (images) {
    var img = images.filter(function (image) { return image.size === '1x'; })[0];
    if ( !img ) {
        // just use first image
        return images[0];
    } else {
        return img;
    }
};

var sizeToResolution = function (size) {
    var m = size.match(/([0-9]+)x/);
    if ( m ) {
        var ratio = m[1];
        return ratio + 'dppx';
    } else {
        // for 'dpi', etc.
        return size;
    }
};


module.exports = postcss.plugin('postcss-image-set-polyfill', function (opts) {
    opts = opts || {};

    return function (css) {
        css.walkDecls('background-image', function (decl) {

            // ignore nodes we already visited
            if ( decl.__visited ) {
                return;
            }

            // make sure we have image-set
            if (!decl.value || decl.value.indexOf('image-set') === -1) {
                return;
            }

            // console.log(decl.value);

            var images = extractList(decl)
            .map(split)
            ;

            // add the default image to the decl
            var image = getDefault(images);
            decl.value = image.url;

            // for each image add a media query
            images
            .filter(function (img) { return img.size !== '1x'; })
            .forEach(function(img) {
                var atrule = postcss.atRule({
                    name: 'media',
                    params: '(screen and min-resolution: ' + sizeToResolution(img.size) + ')'
                });


                // clone empty parent with only relevant decls
                var parent = decl.parent.clone({
                    nodes: []
                });

                var d  = decl.clone({ value: img.url });

                // mark nodes as visited by us
                d.__visited  = true;

                parent.append(d);
                atrule.append(parent);

                decl.root().append(atrule);
            });
        });
    };
});
