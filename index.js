var plist = require('plist'),
_ = require('underscore'),
glob = require('glob');

_.templateSettings = { interpolate: /\{\{(.+?)\}\}/g };
var workflowTemplate = _.template('[{{name}}]({{webaddress}})');
var workflowAuthorTemplate = _.template('[{{name}} by {{createdby}}]({{webaddress}})');

var workflowMarkdown = function(workflowPlist) {
  if (workflowPlist.createdby) {
    return workflowAuthorTemplate(workflowPlist);
  } else {
    return workflowTemplate(workflowPlist);
  }
};

var targetFolder = process.argv[2];

glob(targetFolder+'/*/info.plist', function(error, files) {
  var markdown = files.map(function(file) {
    var parsed = plist.parseFileSync(file);
    return workflowMarkdown(parsed);
  });
  markdown = _.sortBy(markdown, function(md) { return md.toLowerCase(); });
  console.log(markdown.join("\n"));
});
