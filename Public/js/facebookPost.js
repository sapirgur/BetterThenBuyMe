document.getElementById('postButton').addEventListener('click', function() { // the event listener that "captures" the click on the button

    const messageInput = document.getElementById('messageInput'); // gets the input by id
    const message = messageInput.value.trim(); //removes white space from both ends of the message

    if (message === '') { // checks if input content is empty
        alert('Please enter a message.');
        return;
    }

    fetch(`/postToFacebook`, { //sends a fetch request to server with the message as the request body
        method: 'POST', // specifies the http method as post 
        headers: {
            'Content-Type': 'application/json' // indicates that the request body contains json
        },
        body: JSON.stringify({ message: message }) // converts the message to a json string
    })
    .then(response => response.text()) // processes the HTTP response from the server
    .then(data => { // handles the text data obtained from the previous ".then()"
        alert(data); // alert to show on page if succeeded or not
    })
    .catch(error => console.error('Error:', error)); // catches and logs the error to the browser console
});
