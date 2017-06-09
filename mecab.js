var cp = require('child_process');
var sq = require('shell-quote');

var MECAB_LIB_PATH =
    process.env.MECAB_LIB_PATH ?
    process.env.MECAB_LIB_PATH :
    __dirname + '/mecab';

var buildCommand = function (text, dicdir) {
    if (!dicdir) {
        return 'LD_LIBRARY_PATH=' + MECAB_LIB_PATH + ' ' +
            sq.quote(['echo', text]) + ' | ' + MECAB_LIB_PATH + '/bin/mecab';
    }

    return 'LD_LIBRARY_PATH=' + MECAB_LIB_PATH + ' ' +
        sq.quote(['echo', text]) + ' | ' + MECAB_LIB_PATH + '/bin/mecab -d' + dicdir;;
};

var execMecab = function (text, callback, dicdir) {
  var env = {'LD_LIBRARY_PATH':'/usr/local'};
  var result = '';
  var err = '';
  prs = cp.spawn('/usr/local/bin/mecab', [], {'env':env});
  prs.stdout.on('data', (data) => { result += data.toString() });
  prs.stderr.on('data', (data) => { err += data.toString() });
  prs.on('close', (code) => {
    if (code !== 0) { return callback(err); }
    callback(err, result);
  });
  prs.stdin.write(new Buffer(text, 'utf8'));
  prs.stdin.end();
};

var parseFunctions = {
    'pos': function (result, elems) {
        result.push([elems[0]].concat(elems[1].split(',')[0]));
        return result;
    },

    'morphs': function (result, elems) {
        result.push(elems[0]);
        return result;
    },

    'nouns': function (result, elems) {
        var tag = elems[1].split(',')[0];
        
        if (tag === 'NNG' || tag === 'NNP') {
            result.push(elems[0]);
        }

        return result;
    }
};

var parse = function (text, method, callback, dicdir) {
    execMecab(text, function (err, result) {
        if (err) { return callback(err); }

        result = result.split('\n').reduce(function(parsed, line) {
            var elems = line.split('\t');

            if (elems.length > 1) {
                return parseFunctions[method](parsed, elems);
            } else {
                return parsed;
            }
        }, []);

        callback(err, result);
    }, dicdir);
};

var pos = function (text, callback, dicdir) {
    parse(text, 'pos', callback, dicdir);
};

var morphs = function (text, callback, dicdir) {
    parse(text, 'morphs', callback, dicdir);
};

var nouns = function (text, callback, dicdir) {
    parse(text, 'nouns', callback, dicdir);
};

module.exports = {
    pos: pos,
    morphs: morphs,
    nouns: nouns
};
