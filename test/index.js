var spawn = require('child_process').spawn;
var expect = require('chai').expect;
var path = require('path');
var chalk = require('chalk');

describe('goosecon', function() {
    var replServer;
    var filePath = path.resolve(__dirname + '/../bin/goosecon.js');

    before(function() {
        replServer = spawn('node', [filePath, '--mongo-db', 'mongodb://localhost/test', '--models-dir', './test/models', '--modules', './test/modules']);        
    
        var result = '';
        var err = '';
        
        replServer.stdout.on('data', function(data) { 
            result += data; 
            // console.log(result);
        });
        replServer.stderr.on('data', function(data) { 
            err += data; 
            // console.log(err);
        });
    });
    
    after(function() {
        replServer.kill();
    });
    
    it('Throws error if unable to connect to db', function(done) {
        var cp = spawn('node', [filePath,  '--mongo-db', ' ']);
        
        var err = '';
        cp.stderr.on('data', function(data) { err += data; });
        cp.on('exit', function (code) {
            expect(err).contains('Unable to connect to db');
            expect(code).to.equal(1);
            done();
        });
    });

    it('Loads models into context', function(done) {
        test('Person.name', function(err, result) {
            expect(err).to.be.empty;
            expect(result).to.equal('model');
            done();
        });
    });
    
    it('Loads modules into context', function(done) {
        test('typeof Service', function(err, result) {
            expect(err).to.be.empty;
            expect(result).to.equal('object');
            done();
        });
    });

    function test(cmd, cb) {
        var result = '';
        var err = '';
        var timer;

        replServer.stdout.on('data', function(data) { result += data; });
        replServer.stderr.on('data', function(data) { err += data; });
        
        replServer.stdin.write(cmd + '\n');

        function finish() {
            if (result.length === 0 && err.length === 0) {
                timer = setTimeout(finish, 500);
                return;
            }
                
            replServer.stdout.removeAllListeners('data');
            replServer.stderr.removeAllListeners('data');
            return cb(err, clean(result));
        }
        timer = setTimeout(finish, 500);
    }
    
    // Removes ANSI colors and extracts output between quotes
    function clean(string) {
        string = chalk.stripColor(string);
        var substringMatches = string.match(/'([^']+)'/);
        
        if (substringMatches.length > 1) 
            string = substringMatches[1];
        
        return string;
    }
});