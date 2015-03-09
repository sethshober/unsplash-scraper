var request = require('request'); // helping with http calls
var cheerio = require('cheerio'); // jQuery for our backend
var url     = require('url'); // helping with the parsing and manipulation of URLs
var exec    = require('child_process').exec; // allows ability to run shell commands in code
var fs      = require('fs');


// will make a request, grab images, and save them to folder
// hostUrl is your main page to request EX( https://unsplash.com/ )
// photoSrc is the part of the url to get appended to host EX( /imageSource )
// photoDir is the folder where photos will be saved
function photoRequest(hostUrl, photoSrc, photoDir) {

    request(hostUrl + photoSrc, function (error, response, body) {

        // redirect image
        var photoUrl = response.request.uri.href; // find redirected image location
        var photoName = url.parse(photoUrl).pathname.split('/').pop().split('?').shift(); // parse URL into pieces to be manipulated. pathname is portion of URL that comes after host (ex. /assets/img/image.jpg). split that on '/' and pop last item off array which will be 'photo.jpg'
        
        // using curl we have to escape '&' from photoUrl
        if ( ! fs.existsSync(photoDir + photoName) ) { // don't write file if we already have it.
            var curl = 'curl ' + photoUrl.replace(/&/g, '\\&') + ' -o ' + photoDir + photoName + ' --create-dirs'; // curl is used to make request and download files. we start the command with curl and add to it the escaping of all ampersands (&) in photoUrl query string, which is vital for authorization. without this it will fail as an unauthorized request. '-o' tells curl to write the data to a file. 'photoDir+photoName' tells curl to save the file with the defined name within our downloads directory. ' --create-dirs' forces curl to create the download directory if it doesn't already exist.
            var child = exec(curl, function (error, stdout, stderr) { // 'Exec' will run the command string we just defined, and give a callback for errors and outputs useful for debugging. Log filenames and download location as a reference.
                if (error) { console.log(stderr); throw error;}
                else { console.log(photoName + ' downloaded to ' + photoDir); }
            });
        } else { console.log("Already have " + photoName + " in " + photoDir); }
   
    })
} // end photoRequest function declaration


(function() {

    //var photoDir = "./photos/main"; // directory to save photos to
    var hostUrl = 'https://unsplash.com/'; // the web address we are grabbing our photos from
    
    request(hostUrl, function (error, response, body) {
        var photoDir = "./photos/main/"; // directory to save photos to
        if (error) { throw error;}
        $ = cheerio.load(body); // assign returned html to $

        // OUR MAIN PAGE PHOTO SCRAPING FUNCTION
        $('.photo a').each(function () {

            var photoSrc = $(this).attr('href'); // grab img src

            photoRequest(hostUrl, photoSrc, photoDir);
            
        });
        // END MAIN PAGE PHOTO GRAB


        // GRAB PHOTOS FROM INDIVIDUAL ARTISTS
        $('.photo-description h2 a:last-child').each(function () {

            var artistPage = $(this).attr('href'); // grab artist page src
            
            request(hostUrl + artistPage, function (error, response, body) {

                var photoDir = "./photos" + artistPage + "/"; // directory to save photos to

                if(error) { throw error; }
                $ = cheerio.load(body);

                $('.photo a').each(function () {

                    var photoSrc = $(this).attr('href'); // grab img src

                    photoRequest(hostUrl, photoSrc, photoDir);

                });

            }) // end artist request

        });
        // END INDIVIDUAL ARTIST PHOTO GRAB


    }); // end main page request

})(); // end self-invoked-function-call