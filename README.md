# pyt-vanilla-html
The master branch is available at <http://myfeed.rocks/b/>
## Setup
You may want to edit `domains.json` for information about supported back ends.

Use `tools/deploy.sh` to collect all the necessary stuff in a desired deployment directory

You can do it manually, with the following steps:

1. Install necessary npm modules: `$ npm install`
1. Run webpack `$ webpack --config config.js` to make a bundle file
1. Copy the files listed in `release.lst` to a deployment directory
1. Optionally you can edit `index.html` and update md5 hash values of `vanilla.js` and `config.json` to prevent caching outdated files

Then put there and edit `config.josn`:
- the path on your server as "front"
- the path to the files as "static"
- the list of back ends you want to serve in "domains"
 
Then set up the web server to rewrite all the requests to `index.html`, accept those which go to `static`

To have server-side rendering install necessary npm modules: `$ npm install`

Create server-side rendering script `$ webpack --config config_srv.js`

Use the function exported by `vanilla_srv.js` module to handle http requests with `http.createServer`. First parameter is the request, second is the response.

### Example
 You put everything in `/var/pyt-vanilla-html` web directory and you want to access it form `/vanilla`
 
 `$ tools/deploy.sh -d /var/pyt-vanilla-html`
 
 Then you add the following to your web server config:
```
...
location ~ /vanilla/ {
  add_header Cache-Control no-cache;
  rewrite ^/vanilla/s(/.*) /pyt-vanilla-html$1 break;
  rewrite ^.* /pyt-vanilla-html/index.htm break;
}
...
```
  And `config.json`
```
var gConfig = {
  "front":"https://{mydomain}/vainlla/"
  , "static":"https://{mydomain}/vainlla/s/"
  , "leadDomain": "FreeFeed"
  , domains: ["FreeFeed", "MyOtherFF"]
...
```
