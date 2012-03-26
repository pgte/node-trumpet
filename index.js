var sax = require('sax');
var BufferedStream = require('bufferedstream');
var Middle = require('middle');
var select = require('./lib/select');
var log = require('util').log;

module.exports = function (opts) {
    if (!opts) opts = {};
    if (!opts.special) {
        opts.special = [
            'area', 'base', 'basefont', 'br', 'col',
            'hr', 'input', 'img', 'link', 'meta'
        ];
    }
    opts.special = opts.special.map(function (x) { return x.toUpperCase() });
    
    var parser = sax.parser(false);
    var stream = select(parser, opts);
    var bufferedStream = new BufferedStream(1024);
    var middle = new Middle(bufferedStream, stream);

    middle.select = function() {
        return stream.select.apply(stream, arguments);
    }
    
    var buffered = '';
    var pos = 0;
    function update (type, tag) {
        if (type === 'script') {
            var len = tag.length;
        }
        else if (type === 'text') {
            var len = parser.startTagPosition - pos - 1;
        }
        else {
            var len = parser.position - parser.startTagPosition + 1;
        }
        pos = parser.position;
        
        var src = buffered.slice(0, len);
        buffered = buffered.slice(len);
        
        stream.raw(src);
        return src;
    };
    
    stream.write = function (buf) {
        var s = buf.toString();
        buffered += s;
        parser.write(buf.toString());
    };
    
    stream.end = function (buf) {
        if (buf !== undefined) stream.write(buf);
        
        if (pos < parser.position) {
            var s = buffered.slice(0, parser.position - pos);
            stream.raw(s, false);
        }
        parser.close()
    };

    parser.onend = function() {
        stream.emit('end');
    }
    
    parser.onopentag = function (tag) {
        stream.pre('open', tag);
        update('open', tag);
        stream.post('open', tag);
    };

    var paused = false;

    oldResume = parser.resume;
    parser.resume = function() {
        paused = false;
        oldResume.call(parser);
        bufferedStream.resume();
    }

    oldPause = parser.pause;
    parser.pause = function() {
        bufferedStream.pause();
        paused = true;
        oldPause.call(parser);
    }

    parser.onclosetag = function (name) {
        var cbed = false;
        if (paused) { throw new Error('Paused, should not have events'); }
        parser.pause();
        stream.pre('close', name, function() {
            if (cbed) { throw new Error('double callback') }
            cbed = true;
            update('close');
            stream.post('close', name);
            parser.resume();
        });
    };
    
    parser.ontext = function (text) {
        stream.pre('text', text);
        update('text');
        stream.post('text', text);
    };
    
    parser.onscript = function (src) {
        stream.pre('script', src);
        update('script', src);
        stream.post('script', src);
    };

    return middle;
};
