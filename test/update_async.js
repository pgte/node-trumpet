var test = require('tap').test;
var trumpet = require('../');
var fs = require('fs');

test('update_async', function (t) {
    var html = fs.readFileSync(__dirname + '/update_target.html', 'utf8');
    
    var tr = trumpet();
    fs.createReadStream(__dirname + '/update.html').pipe(tr);
    
    tr.select('.b span', function (node) {
        node.update(function (html, done) {
            setTimeout(function() {
                done(html.toUpperCase())
            }, 100);
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
            setTimeout(function() {
              done('<b>NOTHING TO SEE HERE</b>');  
            }, 100);
        });
    });
    
    var data = '';
    tr.on('data', function (buf) { data += buf });

    tr.on('end', function() {
        t.equal(data, html);
        t.end();
    })

});
