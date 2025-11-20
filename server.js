const fs = require('fs');
const path = require('path');

const express = require('express');
const app = express();

const Datastore = require('nedb'); // for database
const port = 3000;

app.use(express.json({ limit: '5mb' }));// to parse json & setting a file limit 
app.use('/', express.static('public/camera'));
app.use('/gallery', express.static('public/gallery'));
app.use('/assets', express.static('public/assets'));

const db = new Datastore({ filename: 'uploads.db', autoload: true }); //creating a database & autoloading

app.listen(port, () => { console.log(`server running on http://localhost:${port}`) });

app.get('/upload', (req, res) => {
    console.log('client is requesting some images');

    // ? search for the files in the database
    db.find({}, (err, doc) => { // doc is an array of the data from the database
        if (err) {
            console.log(`An error occured while searching data`);
        }

        // before doing anything with the data, lets check is there even any image data stored in the database
        if (doc.length === 0) { // if database is empty
            console.log('no images found on the database');
            return res.json('not_found');
        } else {
            let imageData = [[], []]; // a 2D array
            // on the first index we store the filepaths and timestamps on the second 

            doc.forEach(obj => {
                //if the file exists then we can read the data inside 
                if (!fileDoesNotExist(obj.timestamp)) {
                    try {
                        imageData[0].push( // pushing what the function returns to the imageData (2D array), and we are expecting the base64 image data inside the file 
                            fs.readFileSync(`./public/gallery/images/camzy-image-${obj.timestamp}.txt`, 'utf8', (err, data) => {
                                if (err) { console.log('error occured while reading file') };
                                return data;
                            }))

                        imageData[1].push(obj.timestamp);// add the timestamp
                    } catch (err) {
                        if (err.code === 'ENOENT') { // if file was not found
                            console.log('error trying to read file');
                        }
                    }
                } else {
                    console.log('image_file_not_found_on_server');
                    return res.status(204).json('no_images_found');
                }
            })
            console.log('data sent back successfully');
            return res.json(imageData); // if the return is empty arrays, then it means the files where deleted manually/ do not exist 
        }

    })

})

app.post('/upload', (req, res) => {
    let requestData = req.body;
    const filepath = path.join(__dirname, `public/gallery/images/camzy-image-${requestData.timestamp}.txt`);
    fs.writeFile(filepath, requestData.imageBase64, (err) => {
        if (err) {
            console.log(`could not store file because error occured\nError : ${err}`);
        } else {
            console.log('file along with image data created successfully');

            db.insert({ filepath, timestamp: requestData.timestamp }, (err, doc) => {
                if (err)
                    console.log(err);
                else {
                    console.log('image location stored successfully on database');
                    recordEvent('uploads', filepath);
                }
            })
        }
    })

    res.json('image successfully stored');
})

//Deleting images
app.delete("/upload", (req, res) => {
    //separating filename and timestamp in a their own variables 
    const filename = req.body.imageName;
    const timestamp = req.body.timestamp;

    // check if the file exists
    if (!fileDoesNotExist(filename)) {
        const pathToFile = `public/gallery/images/${filename}.txt`;
        //locate the file and delete the file
        fs.unlink(pathToFile, (err) => {
            if (err) {
                console.log('an error occured could not delete the file', err);
            } else {
                console.log('file deleted successfully');
            }
        })

        //then we delete the file from the database by its timestamp 
        db.remove({ timestamp }, (err) => {
            if (err) {
                console.log('could not delete upload from the database');
            } else {
                console.log('upload removed from the database');
                res.json('image deleted successfully');
            }
        });
    } else {
        console.log('the file you\'re trying to delete does not exist');
    }
})

app.delete('/delete',(req, res) => {
    const images = req.body;
    
    images.forEach(obj => {
        //if the file exists then we can read the data inside 
        if (!fileDoesNotExist(obj.timestamp)) {
            const pathToFile = `public/gallery/images/${obj.imageName}.txt`;
        
            //locate the file and delete the file
            fs.unlink(pathToFile, (err) => {
                if (err) {
                    console.log('an error occured could not delete the file', err);
                } else {
                    console.log('file deleted successfully');
                }
            })

            //then we delete the image file from the database by its timestamps 
            db.remove({ timestamp: obj.timestamp }, (err) => {
                if (err) {
                    console.log('could not delete upload from the database');
                } else {
                    console.log('upload removed from the database');
                }
            });
        } else {
            console.log('file does not exist')
        }
    })

    return res.json('images deleted successfully');
})

// function records events by adding them to a .log file
// event like when the file was stored and its location
function recordEvent(filename, eventInfo) {
    const eventRecord = `----\nwhere : ${eventInfo}\nwhen : ${Date()}\n`;

    // adding info to the file
    fs.appendFile(`${filename}.log`, (eventRecord), (err) => {
        if (err) {
            console.log(err);
        } else {
            console.log('picture event stored to log');
        }
    });
}

//function checks if file does not exist or otherwise
function fileDoesNotExist(filename) {
    fs.exists(`./public/gallery/images/camzy-image-${filename}.txt`, (exists) => { return exists })
}