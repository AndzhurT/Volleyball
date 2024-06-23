const signupRegisterBox = document.querySelector('.signup-register-box');
const loginRegisterLabel = document.querySelector('.login-register-link');
const header = document.querySelector('.headers');
const loginLink = document.querySelector('.login-link');
const signupLink = document.querySelector('.register-link');

loginLink.addEventListener('click', ()=> {
    signupRegisterBox.classList.add('active');
    loginRegisterLabel.classList.add('active');
    header.classList.add('active')
});

signupLink.addEventListener('click', ()=> {
    signupRegisterBox.classList.remove('active');
    loginRegisterLabel.classList.remove('active');
    header.classList.remove('active')
});