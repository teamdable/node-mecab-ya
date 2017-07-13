var cp = require('child_process');
var _ = require('lodash');

var MECAB_LIB_PATH =
  process.env.MECAB_LIB_PATH ?
    process.env.MECAB_LIB_PATH :
    __dirname + '/mecab';

var execMecab = function (text, callback, dicdir) {
  var env = {'LD_LIBRARY_PATH': MECAB_LIB_PATH};
  var cmd = MECAB_LIB_PATH + '/bin/mecab';
  var args = [];
  if (dicdir) {
    args = ['-d', dicdir];
  }

  var results = [];
  var err = ['[ERROR]'];

  var prs = cp.spawn(cmd, args, {'env': env});
  prs.stdout.on('data', (data) => { results.push(data.toString()); });
  prs.stderr.on('data', (data) => { err.push(data.toString()); });
  prs.on('close', (code) => {
    if (code !== 0) {
      return callback(new Error(err.join('')));
    }
    callback(null, results.join(''));
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

    var splitted_texts = _.chain(result).trimEnd().split('\n').value();
    var ret = splitted_texts.reduce(function(parsed, line) {
      var elems = line.split('\t');

      if (elems.length > 1) {
        return parseFunctions[method](parsed, elems);
      } else {
        return parsed;
      }
    }, []);

    callback(err, ret);
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
