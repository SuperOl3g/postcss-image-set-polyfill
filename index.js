var postcss = require('postcss');
var mediaParser = require('postcss-media-query-parser').default;

// get the list of images
var extractList = decl => {
    var stripped = decl.value.replace(/(\r\n|\n)/g, '');
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

    return img ?
        img :
        images[0]; // just use first image
};

var sizeToResolution = size => {
    var m = size.match(/([0-9]+)x/);
    return m ?
        `${72 * m[1]}dpi` :
        size;     // for 'dpi', etc.
};


module.exports = postcss.plugin('postcss-image-set-polyfill', (opts = {}) =>
    css => {
        css.walkDecls(/^(background-image|background)/, decl => {

            // ignore nodes we already visited
            if ( decl.__visited ) {
                return;
            }

            // make sure we have image-set
            if (!decl.value || decl.value.indexOf('image-set') === -1) {
                return;
            }

            // check for the media queries
            var media = decl.parent.parent.params;
            var parsedMedia = media && mediaParser(media);

            var images = extractList(decl).map(split);

            // remember other part of property if it's 'background'
            var suffix = '';
            if(decl.prop === 'background') {
                var beautifiedlVal = decl.value.replace(/(\n|\r)\s+/g, ' ');
                suffix = /.*\)(.*)/.exec(beautifiedlVal)[1];
            }

            // add the default image to the decl
            var image = getDefault(images);
            decl.value = image.url + suffix;

            // for each image add a media query
            images
            .filter( img => img.size !== '1x')
            .forEach( img => {
                var minResQuery = `(min-resolution: ${sizeToResolution(img.size)})`;

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

                var d  = decl.clone({ value: img.url + suffix });

                // mark nodes as visited by us
                d.__visited = true;

                parent.append(d);
                atrule.append(parent);

                decl.root().append(atrule);
            });
        });
    }
);
