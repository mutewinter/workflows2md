var plist = require('plist'),
_ = require('underscore'),
glob = require('glob'),
path = require('path'),
fs = require('fs'),
async = require('async'),
request = require('request');

_.templateSettings = { interpolate: /\{\{(.+?)\}\}/g };
var workflowTemplate = _.template('* [{{name}}]({{url}}) by {{author}}');
var targetFolder = process.argv[2];

var getPlistData = function(file) {
  var plistFile = path.join(file, 'info.plist');
  if (!fs.existsSync(file)) { return {}; }
  var parsed = plist.parseFileSync(plistFile);
  var url = _.isEmpty(parsed.webaddress) ? undefined : parsed.webaddress  ;
  return {
    name: parsed.name,
    author: parsed.createdby,
    url: url
  };
};

var getUpdateData = function(file) {
  var updateFile = path.join(file, 'update.json');
  if (!fs.existsSync(updateFile)) { return {}; }
  var parsed = JSON.parse(fs.readFileSync(updateFile));
  return { remoteJSON: parsed.remote_json };
};

var parseFile = function(file, callback) {
  var plistData = getPlistData(file);
  var updateData = getUpdateData(file);
  if (updateData.remoteJSON) {
    request(updateData.remoteJSON, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        try {
          json = JSON.parse(body);
          return callback(null, _.defaults(plistData, {url: json.download_url}));
        } catch (e) {
          return callback(null, plistData);
        }
      } else {
        return callback(null, plistData);
      }
    });
  } else {
    return callback(null, plistData);
  }
};

var folders = glob.sync(path.join(targetFolder, '/*/'));

async.map(folders, parseFile, function(err, results) {
  results = results.map(function(result) {
    if (result.url && !/^http/.test(result.url)) {
      result.url = 'http://' + result.url;
    }
    return result;
  });
  results = _.sortBy(results, function(data) {
    return data.name.toLowerCase();
  });
  console.log('_Generated with '+
              '[workflows2md](https://github.com/mutewinter/workflows2md)._');
  console.log('');
  console.log(_.map(results, workflowTemplate).join("\n"));
});
