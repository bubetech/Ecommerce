// form

let formBtn = document.querySelector('.submit-btn');
let loader = document.querySelector('.loader')

formBtn.addEventListener('click', () =>{
   let fullname = document.querySelector('#name') || null;
   let email = document.querySelector('#email');
   let password = document.querySelector('#password');
   let number = document.querySelector('#number') || null;
   let tac = document.querySelector('#tc'|| null);


   if(fullname != null){
    // sign up page 
     // form validation
        if (fullname.value.length < 3){
            showFormError('name must be 3 letters long');
        } else if (!email.value.length){
            showFormError('enter your email');
        } else if (password.value.length < 8){
            showFormError('password must be 8 letters long.');
        } else if (isNaN(Number(number.value)) || number.value.length < 10){
            showFormError('invalid number, please enter valid one');
        } else if (!tac.checked){
            showFormError('you must agree to our terms and condition');
        } else{
            // submit form
            loader.style.display = 'block';
            sendData('/signup',{
                name: fullname.value,
                email: email.value,
                password: password.value,
                number: number.value,
                tac :tac.checked
        
            })
        }
   } else {
        //login page
        if(!email.value.length || !password.value.length){
            showFormError('fill all the inputs')
        }else{
            // submit form
            loader.style.display = 'block';
            sendData('/login',{
                email: email.value,
                password: password.value
            })
        }

   }
})


