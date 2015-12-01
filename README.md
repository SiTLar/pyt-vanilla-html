# pyp-vanila-html
The master branch is available at [http://moimosk.ru/frf/](http://moimosk.ru/frf/)
## Setup
Create client side script with webpack: `$ webpack --config config.js`
Put everything in a directory, then edit `config.josn`:
- the path on your server as "front"
- the path to the files as "static"
- the backend as "serverURL"
- the real-time socket URL as "rtURL"
 
Then set up the web server to rewrite all the requests to `index.html`, accept those whitch go to `static`

To have server-side rendering install nesessery npm modules: `$ npm install`
Create server-side rendering script `$ webpack --config config_srv.js`
Use the function exported by `vanilla_srv.js` module to handle http requests with `http.createServer`. First parameter is the request, second is the response.

### Example
 You put everything in `/pyt-vanilla-html` web directory and you want to access it form `/vanilla`
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
"serverURL":"{backend url}"
  , "front":"https://{mydomain}/vainlla/"
  , "static":"https://{mydomain}/vainlla/s/"
  , "rtURL":"{backend real-time}"
...
```


 
 
