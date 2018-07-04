//this code will run on every page. need to separate code into different js pages
//test commit
// $('#changeURL').submit(function(ev){
//     // ev.preventDefault();
//     var pathname = window.location.href;
//     var pathObj = pathname.split('/');
//     var actionURL = document.getElementById('changeURL').action;
//     actionURL = actionURL + pathObj[pathObj.length-1];
//     alert(actionURL)
//     // this.submit();
// })
function changeURL(){
    var pathname = window.location.href;
    var pathObj = pathname.split('/');
    var actionURL = document.getElementById('changeURL').action;
    actionURL = actionURL + pathObj[pathObj.length-1];
    document.getElementById('changeURL').action = actionURL;
}

$(document).ready(function(){
    var first_name = document.getElementById("first_name");
    var last_name = document.getElementById("last_name");
    var security_question = document.getElementById("security_question");
    var security_answer = document.getElementById("security_answer");
    var email_address = document.getElementById("email_address");
    var email_confirm = document.getElementById("email_address_confirm");
    var password = document.getElementById("passwordNew");
    var password_confirm = document.getElementById("passwordNew_confirm");
    var password_message = document.getElementById("password_message");

    $("#password_checking").hide();
    $("#email_checking").hide();

    first_name.onblur = function(){
        sessionStorage.setItem('first_name', first_name.value)
    };
    last_name.onblur = function(){
        sessionStorage.setItem('last_name', last_name.value)
    };
    email_address.onblur = function(){
        sessionStorage.setItem('email_address', email_address.value);
    };
    email_confirm.onblur = function(){
        sessionStorage.setItem('email_address_confirm', email_confirm.value);
        if (email_confirm.value !== email_address.value){
            $("#email_checking").css("display", "block");
            $("#email_address_confirm").css("background-color", "red")
        }else {
            $("#email_checking").css("display", "none");
            $("#email_address_confirm").css("background-color", "white")

        }
    };
    security_question.onblur = function(){
        sessionStorage.setItem('security_question', security_question.value)
    };
    security_answer.onblur = function(){
        sessionStorage.setItem('security_answer', security_answer.value)
    };

    password.onfocus = function(){
        password_message.style.display = "block";
        var lowerCaseLetters = /[a-z]/g;
        var upperCaseLetters = /[A-Z]/g;
        var numbers = /[0-9]/g;
        var symbols = /[#?!@$%^&*-]/g
        password.onkeyup = function() {
            if (password.value.match(lowerCaseLetters)) {
                var lower_check = true;
            }
            if (password.value.match(upperCaseLetters)) {
                var upper_check = true;
            }
            if (password.value.match(numbers)) {
                var number_check = true;
            }
            if (password.value.length >= 8) {
                var length_check = true;
            }
            if (password.value.match(symbols)){
                var symbols_check = true;
            }
            if (lower_check && upper_check && number_check && length_check && symbols_check) {
                document.getElementById("letter").classList.remove("invalid");
                document.getElementById("capital").classList.remove("invalid");
                document.getElementById("number").classList.remove("invalid");
                document.getElementById("length").classList.remove("invalid");
                document.getElementById("symbol").classList.remove("invalid");

            } else {
                // lower_check = false;
                // upper_check = false;
                // number_check = false;
                // length_check = false;
                document.getElementById("letter").classList.add("invalid");
                document.getElementById("capital").classList.add("invalid");
                document.getElementById("number").classList.add("invalid");
                document.getElementById("length").classList.add("invalid");
                document.getElementById("symbol").classList.add("invalid");

            }
        }
    };

    password_confirm.onblur = function(){
        if(password_confirm.value !== password.value) {
            $("#password_checking").css("display", "block");
            $("#passwordNew_confirm").css("background-color", "red")
        } else {
            $("#password_checking").css("display", "none");
            $("#passwordNew_confirm").css("background-color", "white")

        }

    };

    if(sessionStorage.getItem('first_name')){
        first_name.value = sessionStorage.getItem('first_name');
    }
    if(sessionStorage.getItem('last_name')){
        last_name.value = sessionStorage.getItem('last_name');
    }
    if(sessionStorage.getItem('email_address')){
        email_address.value = sessionStorage.getItem('email_address');
    }
    if(sessionStorage.getItem('email_address_confirm')){
        email_confirm.value = sessionStorage.getItem('email_address_confirm');
    }
    if(sessionStorage.getItem('security_question')){
        security_question.value = sessionStorage.getItem('security_question');

    }
    if(sessionStorage.getItem('security_answer')){
        security_answer.value = sessionStorage.getItem('security_answer');
    }

});




