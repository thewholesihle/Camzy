console.log('script loaded')
const imagesContainer = document.querySelector('.images-container');
const deleteSelectedButton =  document.querySelector('.delete-images-btn');
const loading = document.querySelector('.loading-state');
const selectImagesButton = document.querySelector('.select-images-btn'); //select multiple images button
let selectedImages = [] //store selected images in object 
let selectedImagesElem = []; // image container
fetchImages().then((res) => { // response is a 2D array with filepaths to the images on the first array & timestamps on the second array
    let filepaths = res[0];
    let timestamps = res[1];

    if (typeof res == 'object') {  // response is an object
        if (filepaths.length === 0 && timestamps.length === 0) { // check if the arrays are empty, meaning files where stored but then deleted manually
            alert('there no files found on the system')
        } else {
            loading.classList.toggle('done'); //hide the image
            if (filepaths.length > 2) { //you can use the selector if you have more than 2 images
                selectImagesButton.style.display = "inline-block"
            }
            for (let i = 0; i < filepaths.length; i++) {
                const imageContainer = document.createElement('div');
                const image = document.createElement('img');
                const txtElem = document.createElement('p');
                const txt = document.createTextNode(`camzy-image-${timestamps[i]}`);
                const deleteButton = document.createElement('img');
                const imageTextContainer = document.createElement('div');
                const selectCheckbox = document.createElement('input');

                txtElem.appendChild(txt);

                image.src = filepaths[i];
                image.width = 200;
                selectCheckbox.type = "checkbox";
                selectCheckbox.setAttribute('name', 'select-image');
                //make images undraggable
                [image, deleteButton].forEach(elem => {
                  elem.draggable = false;
                })
                image.classList.add('image')
                imageContainer.classList.add('image-container');
                txtElem.classList.add('image-name');
                imageTextContainer.classList.add('image-text-container');
                selectCheckbox.classList.add('image-select-checkbox');
                deleteButton.classList.add('delete-btn')
                deleteButton.src = '../assets/trash.svg';
                deleteButton.width = 30;
                deleteButton.title = "Delete Image"

                //adding element to body of the page
                imagesContainer.append(imageContainer);
                imageContainer.append(imageTextContainer)
                imageTextContainer.append(image)
                imageTextContainer.append(txtElem)
                imageTextContainer.append(selectCheckbox)
                imageContainer.append(deleteButton)

                deleteButton.addEventListener('click', (ev) => {
                    deleteImage({
                        imageName: txtElem.innerText, //attaching the name of the file (to delete from storage)
                        timestamp : timestamps[i] //and the timestamp (to be able to delete it from the database)
                    }).then(response => {
                        alert(response)
                        imageContainer.remove();// remove from page
                    })
                })

                //function for checking if checkbox elements are checked
                let isChecked = (checkboxElem) => checkboxElem.checked ? true : false;
                
                // listen for a change on the checkboxes
                selectCheckbox.addEventListener('change', (ev) => {
                    if (isChecked(selectCheckbox)) {
                        selectedImages.push({
                            imageName : selectCheckbox.previousSibling.innerText,
                            timestamp : timestamps[i]
                        })
                        //add the parent element of the selected image to the selectedImages array
                        selectedImagesElem.push(selectCheckbox.parentElement.parentElement)
                        // scale down the element
                        ev.target.parentElement.parentElement.classList.toggle('selected'); // scale back previously checked images
                        
                        // console.log(selectedImages, selectedImagesElem)
                    } else {
                        let newArr = removeImageFromArray(selectedImages, selectCheckbox.previousSibling.innerText)
                        let newSelectedImagesElem = removeArrElem(selectedImagesElem, selectCheckbox.parentElement.parentElement);
                        
                        selectedImages = newArr;
                        selectedImagesElem = newSelectedImagesElem;
                        ev.target.parentElement.parentElement.classList.toggle('selected'); // scale back previously checked images

                        // console.log(selectedImages, selectedImagesElem)
                    }

                    // can delete images if the selected images are more than 1
                    if(selectedImages.length > 1) {
                        [selectImagesButton, deleteSelectedButton].forEach(button => {
                            button.classList.add('allowed')
                        })
                        selectImagesButton.innerText = `${selectedImages.length} Images Selected`
                    } else {
                        [selectImagesButton, deleteSelectedButton].forEach(button => {
                            button.classList.remove('allowed');
                        })
                        selectImagesButton.innerText = `${selectedImages.length} Images Selected`
                    }
                })
            }
        }
    } else if (typeof res == 'string') {
        loading.innerText = res;
    }
})

async function fetchImages() {
    return await fetch('/upload')
        .then((res) => res.json())
        .then((data) => data)
}

//fetch for deleting images
async function deleteImage(imageInfo) { 
    const options = {
        method : 'DELETE',
        headers : {
            "Content-Type" : "application/json"
        },
        body : JSON.stringify(imageInfo)
    }
    return await fetch('/upload', options)
        .then((res) => res.json())
        .then((data) => data)
}

selectImagesButton.addEventListener('click', (ev) => {
    document.querySelectorAll('.image-select-checkbox').forEach(checkbox => {
        checkbox.classList.toggle('toggle');// show the select checkboxes
        if (checkbox.classList.contains("toggle")){
            selectImagesButton.innerText = "Selecting Images..."
            checkbox.checked = false;// uncheck previously checked checkboxes 
        } else {
            deleteSelectedButton.style.display = "none"; //hide delete images button, when selection is disabled
            selectImagesButton.innerText = "Select Images"
            checkbox.parentElement.parentElement.classList.remove('selected');
        }
    })
    selectedImages = []; //user is selecting again so clear the array
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.classList.add('toggle');// show the delete buttons
    })
})

// function removes an element from array and returns the new array
function removeImageFromArray(arr, item) {
    return arr.filter(imageObj => imageObj.imageName !== item)
}

// function remove elem from array
function removeArrElem(arr, item) {
    return arr.filter(elem => elem !== item)
}

//fetch for deleting multiple images
async function deleteImages(images) {
    const options = {
        method : 'DELETE',
        headers : {
            "Content-Type" : "application/json"
        },
        body : JSON.stringify(images)
    }
    return await fetch('/delete', options)
        .then((res) => res.json())
        .then((data) => data)
}

//send a delete request to the server to delete the selected images
deleteSelectedButton.addEventListener('click', () => {
    try {
        deleteImages(selectedImages).then(res => {
            selectedImagesElem.forEach(container => {
                container.remove(); //remove element from page
            })
            selectedImagesElem = [], selectedImages = []; //empty the arrays
            document.querySelectorAll('.image-select-checkbox').forEach(checkbox => {
                checkbox.classList.remove('toggle');// hide the checkboxes
            })
            document.querySelectorAll('.delete-btn').forEach(button => {
                button.classList.remove('toggle');// show the delete buttons
            })

            selectImagesButton.innerText = "Select Images"
            deleteSelectedButton.classList.remove('allowed'); // hide the deleteImages Button
            selectImagesButton.classList.remove('allowed'); // to default border radius

            //after deleting, hide the selection button if images left are not more than 2
            if (!(document.querySelectorAll('.image').length > 2)) {
                selectImagesButton.style.display = "none";
            }
            console.log(res);
        })
    } catch (error) {
        console.log('could not delete images');
    }
})