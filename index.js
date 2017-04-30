var postcss = require('postcss');
var mediaParser = require('postcss-media-query-parser').default;

// get the list of images
var extractList = value => {
    var stripped = value.replace(/(\r\n|\n)/g, '');
    var inside = stripped.match(/image-set\(([\s\S]+)\)/)[1];
    return postcss.list.comma(inside);
};

// get the size of image
var extractSize = image => {
    var l = postcss.list.space(image);
    return l.length === 1 ? '1x' : l[1];
};

// get the url of an image
var extractUrl = image => {
    var url = postcss.list.space(image)[0];
    return url.match(/url\(/) || url.match(/image\(/) ?
        url :
        `url(${url})`;
};

// split url and size
var split = image => ({
    size: extractSize(image),
    url:  extractUrl(image)
});

// get the default image
var getDefault = images => {
    var img = images.find( image => image.size === '1x' );

    return img || images[0]; // just use first image
};

var sizeToResolution = size => {
    var m = size.match(/^([0-9]+)x$/);
    return m ?
        `${72 * m[1]}dpi` :
        size;     // for 'dpi', etc.
};

var getSuffix = value => {
    var beautifiedlVal = value.replace(/(\n|\r)\s+/g, ' ');
    return  /.*\)(.*)/.exec(beautifiedlVal)[1];
};

module.exports = postcss.plugin('postcss-image-set-polyfill', (opts = {}) =>
    css => {
        css.walkDecls(/^(background-image|background)$/, decl => {

            // ignore nodes we already visited
            if ( decl.__visited ) {
                return;
            }

            // make sure we have image-set
            if (!decl.value || decl.value.indexOf('image-set') === -1) {
                return;
            }

            var commaSeparatedValues = postcss.list.comma(decl.value);
            var mediaQueryList = new Set();

            var parsedValues = commaSeparatedValues.map(value => {
                var result = {};

                if (value.indexOf('image-set') === -1) {
                    result.default = value;
                    return result;
                }

                var images = extractList(value).map(split);

                // remember other part of property if it's 'background' property
                var suffix = decl.prop === 'background' ?  getSuffix(value) : '';

                // add the default image to the decl
                result.default = getDefault(images).url + suffix;

                // for each image add a media query
                if (images.length > 1) {
                    images.forEach(img => {
                        if (img.size !== '1x') {
                            mediaQueryList.add(img.size);
                            result[img.size] = img.url + suffix;
                        }
                    });
                }

                return result;
            });

            decl.value = parsedValues.map(val => val.default).join(',');

            // check for the media queries
            var media = decl.parent.parent.params;
            var parsedMedia = media && mediaParser(media);

            mediaQueryList
                .forEach( size => {
                    var minResQuery = `(min-resolution: ${sizeToResolution(size)})`;

                    var paramStr = parsedMedia ?
                        parsedMedia.nodes.map(queryNode => `${queryNode.value} and ${minResQuery}`).join(',') :
                        minResQuery;

                    var atrule = postcss.atRule({
                        name: 'media',
                        params: paramStr
                    });

                    // clone empty parent with only relevant decls
                    var parent = decl.parent.clone({
                        nodes: []
                    });

                    var d  = decl.clone({ value: parsedValues.map(val => val[size] || val.default).join(',')});

                    // mark nodes as visited by us
                    d.__visited = true;

                    parent.append(d);
                    atrule.append(parent);

                    decl.root().append(atrule);
                });
        });
    }
);
