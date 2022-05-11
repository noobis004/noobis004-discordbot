const { JSDOM } = require( "jsdom" );
const { window } = new JSDOM( "" );
const $ = require( "jquery" )( window );
const fs = require ( 'fs' );

var urlAlreadyExists;
const fractalFile = 'txt-arrays/fractals.txt';
const readFileLines = filename =>
   fs.readFileSync(filename)
   .toString('UTF8')
   .split('\n');

for (let i = 0; i < 1500; i++) {
    var fractals = readFileLines(fractalFile)
    var xhr = $.get("http://api.giphy.com/v1/gifs/random?api_key=IvKx1Vuu8vFKrBfXKx8WYmRDfd2F54aP&tag=fractal");
        xhr.done(function(response) {
            var giphyID = response.data.id;
            var giphyURL = 'https://media.giphy.com/media/' + giphyID + "/giphy.gif"
            console.log(giphyURL);

            for(let n = 0; n < fractals.length; n++) {
                if (giphyURL === fractals[n]) {
                    urlAlreadyExists = true;
                } 
            }
            if (urlAlreadyExists) {
                console.log('url already exists')
                urlAlreadyExists = false;
            } else {
                finalURL = '\n' + giphyURL;

                fs.writeFile(fractalFile, finalURL, { flag: 'a+' }, err => {
                    if (err) {
                        console.error(err);
                    }
                });
            }
        });
}