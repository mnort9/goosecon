#!/usr/bin/env node

var repl = require('repl');
var fs = require('fs');
var path = require('path');
var vm = require('vm');
var util = require('util');
var rc = require('rc');
var _ = require('underscore');
var chalk = require('chalk');

var argv = require('yargs')
    .usage('Usage: $0 [options]')
    .option('mongo-db', {
        describe: 'MongoDB URL'
    })
    .option('models-dir', {
        describe: 'Path to models directory'
    })
    .option('mongoose-dir', {
        describe: 'Path to mongoose'
    })
    .help('h')
    .alias('h', 'help')
    .argv;
    
// Override options
var config = rc('goosecon', {}, argv);
    
var mongoosePath = config.mongooseDir ? path.normalize(path.resolve(process.cwd(), config.mongooseDir)) : 'mongoose';
var mongoose = require(mongoosePath);
var replServer;

mongoose.connect(config.mongoDb);

mongoose.connection.on('error', function(err) {
    console.error('Unable to connect to db ' + config.mongoDb + '\n' + err);
    process.exit(1);
});
    
function startReplServer () {
    replServer = repl.start({
        eval: function(cmd, context, filename, cb) {
            var result;
            
            try { 
                result = vm.runInContext(cmd, context, filename);
            } 
            catch(err) { return cb(err); }
            
            // instanceof doesn't work when mongoose version < 4
            if (_.isObject(result) && (result instanceof mongoose.Query || result.constructor.name === 'Query')) {
                result.exec(function(err, doc) { 
                    if (err) return cb(err);           
                    return cb(null, doc); 
                });
            } else {
                cb(null, result);
            }
        },
        writer: function(val) {
            if (!val) return '';
            
            try { 
                val = JSON.parse(JSON.stringify(val));
                console.log(util.inspect(val, { colors: true, depth: 7 }));
                return ''; 
            }
            catch(err) { console.error('Unable to stringify JSON'); }
                
            console.log(val);
            return ''; // Prevents 'undefined' output
        }
    });
}

function loadModules() {
    var moduleNames = [];
    var files = _.compact(_.flatten([findModels(), findModules()]));
        
    // Add models to repl context
    files.forEach(function(file) {  
        var module;
        try { module = require(file); }
        catch(err) { return; }
        
        // Get module name and capitalize first letter
        var moduleName = path.basename(file, '.js');
        moduleName = moduleName.charAt(0).toUpperCase() + moduleName.slice(1);
        
        replServer.context[moduleName] = module;
        moduleNames.push(moduleName);
    });
    
    if (moduleNames) {
        console.log(chalk.underline('\n' + moduleNames.length + ' Modules Loaded:'));
        console.log(chalk.red(moduleNames.join(', ')) + '\n');
        replServer.displayPrompt();
    }
}

function findModels() {
    var modelsPath = config.modelsDir;
    var files;
        
    if (!modelsPath) {
        var cwdFiles = fs.readdirSync(process.cwd());
                
        // Search working directory for models directory
        if (_.contains(cwdFiles, 'models'))
            modelsPath = path.resolve(process.cwd() + '/' + 'models');    
        else
            return;
    }    
    
    files = fs.readdirSync(modelsPath);
    files = files.map(function(file) { return path.resolve(modelsPath + '/' + file); });        
        
    return files;
}

function findModules() { 
    if (!config.modules) return;
    
    // Convert command line argument to array
    var modulesDirectories = typeof config.modules === 'string' ?  [config.modules] : config.modules;
            
    var modules = modulesDirectories.map(function(modulesDirPath) {
        var files = fs.readdirSync(modulesDirPath);
        return files.map(function(file) { return path.resolve(modulesDirPath + '/' + file); });
    });
        
    return modules;
}

function displayIntroText() {
    var logo = '\n' + 
    '██████╗  ██████╗  ██████╗ ███████╗███████╗ ██████╗ ██████╗  ███╗   ██╗\n' +
    '██╔════╝ ██╔═══██╗██╔═══██╗██╔════╝██╔════╝██╔════╝██╔═══██╗████╗  ██║\n' +
    '██║  ███╗██║   ██║██║   ██║███████╗█████╗  ██║     ██║   ██║██╔██╗ ██║\n' +
    '██║   ██║██║   ██║██║   ██║╚════██║██╔══╝  ██║     ██║   ██║██║╚██╗██║\n' +
    '╚██████╔╝╚██████╔╝╚██████╔╝███████║███████╗╚██████╗╚██████╔╝██║ ╚████║\n' +
    '╚═════╝  ╚═════╝  ╚═════╝ ╚══════╝╚══════╝ ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝\n';
    console.log(chalk.red(logo));
    console.log('Loading Modules...');
}
 

displayIntroText();
startReplServer();
loadModules();