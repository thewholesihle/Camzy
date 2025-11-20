// setup p5 canvas
function setup() {
    noCanvas();
    video = createCapture(VIDEO);
}


function takePicture() {
    video.loadPixels();
    videoFrameData = video.canvas.toDataURL();
    const data = {
        imageBase64: videoFrameData,
        timestamp: Date.now()
    }
    storeImage(data)
    .then((res) => {
        console.log(res)
    })
}

async function storeImage(imageData) {
    const options = {
        method : 'POST',
        headers : {
            "Content-Type" : "application/json"
        },
        body : JSON.stringify(imageData)
    }
    return await fetch('/upload', options)
    .then((res) => res.json())
    .then((data) => data)
}


function draw() {
    image(video)
    filter(INVERT);
  }

const mirrorCheckbox = document.querySelector('#mirror-checkbox');
//function for checking if checkbox elements are checked
let isChecked = (checkboxElem) => checkboxElem.checked ? true : false;

//listen when page has loaded 
window.addEventListener('load', (ev) => {
    //select the video element (as it was created during runtime)
    let videoCapture = document.querySelector('video');
    
    //check the if the checkbox is checked from previous visit
    if (isChecked(mirrorCheckbox)) {
        videoCapture.classList.add('mirror');
    } else {
        videoCapture.classList.remove('mirror');
    }

    // listen for change, then check if checkbox is checked
    mirrorCheckbox.addEventListener('change', (ev) => {
        if (isChecked(mirrorCheckbox)) {
            videoCapture.classList.add('mirror');
        } else {
            videoCapture.classList.remove('mirror');
        }
    })
})