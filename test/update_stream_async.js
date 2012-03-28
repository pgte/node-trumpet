var test = require('tap').test;
var trumpet = require('../');
var fs = require('fs');

test('update_stream_async', function (t) {
    var html = fs.readFileSync(__dirname + '/update_target_streamed.html', 'utf8');
    
    var tr = trumpet();
    fs.createReadStream(__dirname + '/update.html').pipe(tr);
    
    tr.select('.b span', function (node) {
        node.update(function (html, done) {
            var partial = trumpet();
            fs.createReadStream(__dirname + '/update_stream_partial_1.html', { encoding: 'utf8' }).pipe(partial);
            partial.select('.partial', function(node) {
                node.update(html.toUpperCase());
            });
            done(partial);
        });
    });
    
    tr.select('.c', function (node) {
        node.update('---');
    });
    
    tr.select('.d', function (node) {
        node.remove();
    });
    
    tr.select('.e', function (node) {
        node.remove();
    });
    
    tr.select('.f', function (node) {
        node.replace(function(html, done) {
            var partial = trumpet();
            fs.createReadStream(__dirname + '/update_stream_partial_2.html', { encoding: 'utf8'}).pipe(partial);
            partial.select('.partial', function(node) {
                node.replace('<b>NOTHING TO SEE HERE</b>');
            });
            done(partial);
        });
    });
    
    var data = '';
    tr.on('data', function (buf) { data += buf });

    tr.on('end', function() {
        t.equal(data, html);
        t.end();
    })

});
