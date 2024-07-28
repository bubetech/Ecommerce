let user = JSON.parse(sessionStorage.user || null);

window.onload = () => {
    if (user == null) {
        location.replace('/login');
    }
}

let editables = [...document.querySelectorAll('*[contenteditable="true"]')];

editables.map((element) => {
    let placeholder = element.getAttribute('data-placeholder');
    element.innerHTML = placeholder;
    element.addEventListener('focus', () => {
        if (element.innerHTML === placeholder) {
            element.innerHTML = '';
        }
    });
    element.addEventListener('focusout', () => {
        if (!element.innerHTML.length) {
            element.innerHTML = placeholder;
        }
    });
});

// Image upload
let uploadInput = document.querySelector('#upload-image');
let imagePath = 'img/noImage.png'; // default image 

uploadInput.addEventListener('change', () => {
    const file = uploadInput.files[0];
    let imageUrl;

    if (file.type.includes('image')) {
        fetch('/s3url').then(res => res.json())
            .then(url => {
                fetch(url, {
                    method: 'PUT',
                    headers: new Headers({ 'Content-Type': 'image/jpeg' }),
                    body: file
                }).then(res => {
                    if (res.ok) {
                        imagePath = url.split("?")[0];
                        let productImage = document.querySelector('.product-img');
                        productImage.src = imagePath;
                    } else {
                        throw new Error('Failed to upload image.');
                    }
                }).catch(err => {
                    console.error('Error uploading image:', err);
                    showFormError('Failed to upload image.');
                });
            }).catch(err => {
                console.error('Error getting S3 URL:', err);
                showFormError('Failed to get S3 URL.');
            });
    } else {
        showFormError('File is not an image.');
    }
});

// Form submission
let addProductBtn = document.querySelector('.add-product-btn');
let loader = document.querySelector('.loader');

let productName = document.querySelector('.product-title');
let shortDes = document.querySelector('.product-desc');
let price = document.querySelector('.price');
let detail = document.querySelector('.desc');
let tags = document.querySelector('.tags');

addProductBtn.addEventListener('click', () => {
    // Verification
    if (productName.innerHTML === productName.getAttribute('data-placeholder')) {
        showFormError('Should enter product name.');
    } else if (shortDes.innerHTML === shortDes.getAttribute('data-placeholder')) {
        showFormError('Description should be 80 letters long.');
    } else if (price.innerHTML === price.getAttribute('data-placeholder') || !Number(price.innerHTML)) {
        showFormError('Enter valid price.');
    } else if (detail.innerHTML === detail.getAttribute('data-placeholder')) {
        showFormError('You must enter detail.');
    } else if (tags.innerHTML === tags.getAttribute('data-placeholder')) {
        showFormError('Enter tags.');
    } else {
        // Submit form
        loader.style.display = 'block';
        let data = productData();
        if(productId){
            data.id = productId;
        }
        sendData('/add-product', data);
    }
});

const productData = () => {
    let tagsArr = tags.innerText.split(",").map(item => item.trim().toLowerCase());

    return {
        name: productName.innerText,
        shortDes: shortDes.innerText,
        price: price.innerText,
        detail: detail.innerText,
        tags: tagsArr, // Corrected to pass array, not string
        image: imagePath, // Corrected key from 'Image' to 'image'
        email: JSON.parse(sessionStorage.user).email,
        draft: false
    };
};

//save draft btn
let draftBtn = document.querySelector('.draft-btn');

draftBtn.addEventListener('click', () => {
    if(!productName.innerHTML.length || productName.innerHTML === productName.getAttribute('data-placeholder')){
        showFormError('enter product name at least');
    }else{ //dont validate the form
        let data  = productData();
        loader.style.display = 'block';
        data.draft = true;
        if(productId){
            data.id = productId;
        }
        sendData('/add-product', data)

    }
})


//edit page

const fetchProductData = () =>{
    addProductBtn.innerHTML = 'save product';
    fetch('/get-products', {
        method: 'post',
        headers: new Headers ({'Content-Type' : 'application/json'}),
        body: JSON.stringify({id: productId})
    }).then(res => res.json())
    .then(data =>{
        setFormData(data)
    })
    .catch(err => console.log(err))
}
const setFormData =(data) =>{
    productName.innerHTML = data.name;
    shortDes.innerHTML = data.shortDes;
    price.innerHTML = data.price;
    detail.innerHTML = data.detail;
    tags.innerHTML = data.tags;

    let productImg = document.querySelector('.product-img')
    productImg.src = imagePath = data.image;

}

let productId = null;
if(location.pathname != '/add-product') {
    productId =decodeURI(location.pathname.split('/').pop());
    fetchProductData();
}