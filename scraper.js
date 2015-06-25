var request = require('request') // helping with http calls
  , cheerio = require('cheerio') // jQuery for our backend
  , url     = require('url') // helping with the parsing and manipulation of URLs
  , exec    = require('child_process').exec // allows ability to run shell commands in code
  , fs      = require('fs') // allows interaction with file system



/**
 * will make a request, grab images, and save them to specified folder
 * @function
 * @param {string} hostUrl - hostUrl is your main page to request EX( https://unsplash.com/ )
 * @param {string} photoSrc - photoSrc is the part of the url to get appended to hostUrl EX( /imageSource )
 * @param {string} photoDir - photoDir is the folder where photos will be saved
 */
function photoRequest(hostUrl, photoSrc, photoDir) {

    request(hostUrl + photoSrc, function (error, response, body) {

        // redirect image
        var photoUrl  = response.request.uri.href // find redirected image location
          , photoName = url.parse(photoUrl).pathname.split('/').pop().split('?').shift() // parse URL into pieces to be manipulated. pathname is portion of URL that comes after host (ex. /assets/img/image.jpg). split that on '/' and pop last item off array which will be 'photo.jpg'

        if ( photoName.indexOf('.') === -1 ) photoName = photoName.concat('.jpg') // if no extension add jpg

        // using curl we have to escape '&' from photoUrl
        fs.exists(photoDir + photoName, function (exists) { // this may be bad practice ( vulnerable to race conditions )

            if ( ! exists ) { // write file if it doesn't exist.
            
                var curl  = 'curl ' + photoUrl.replace(/&/g, '\\&') + ' -o ' + photoDir + photoName + ' --create-dirs' // curl is used to make request and download files. we start the command with curl and add to it the escaping of all ampersands (&) in photoUrl query string, which is vital for authorization. without this it will fail as an unauthorized request. '-o' tells curl to write the data to a file. 'photoDir+photoName' tells curl to save the file with the defined name within our downloads directory. ' --create-dirs' forces curl to create the download directory if it doesn't already exist.
                  , child = exec(curl, function (error, stdout, stderr) { // 'Exec' will run the command string we just defined, and give a callback for errors and outputs useful for debugging. Log filenames and download location as a reference.
                    
                    if (error) throw error
                    else console.log(photoName + ' downloaded to ' + photoDir)
                
                })

            } else console.log("Already have " + photoName + " in " + photoDir) // don't write file. we already have it.
        })
    })
} // end photoRequest



// Grab us some photos!
function grabPhotos() {

    var hostUrl = 'https://unsplash.com/' // the web address we are grabbing our photos from
    
    request(hostUrl, function (error, response, body) {

        var photoDir = "./photos/main/" // directory to save photos to
        if (error) throw error
        $ = cheerio.load(body) // assign returned html to $

        // our main page photo scraping function
        $('.photo a').each(function () {

            var photoSrc = $(this).attr('href') // grab img src
            photoRequest(hostUrl, photoSrc, photoDir)
            
        }) // end main page photo grab


        // grab photos from individual artists
        $('.photo-description h2 a:last-child').each(function () {

            var artistPage = $(this).attr('href') // grab artist page src
            
            request(hostUrl + artistPage, function (error, response, body) {

                var photoDir = "./photos" + artistPage + "/" // directory to save photos to
                if (error) throw error
                $ = cheerio.load(body)

                $('.photo a').each(function () {

                    var photoSrc = $(this).attr('href') // grab img src
                    photoRequest(hostUrl, photoSrc, photoDir)

                })

            }) // end artist request

        }) // end individual artist photo grab


    }) // end main page request

} // end grabPhotos

grabPhotos() // run our scraper