// Helper function that generates a random alpha/numeric string
var randomString = function(length) {
    var str = "";
    var range = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789._~-";
    for(var i = 0; i < length; i++) {
        str += range.charAt(Math.floor(Math.random() * range.length));
    }
    return str;
}

// Helper 	 that parses a query string into a dictionary object
var parseQueryStr = function( queryString) {
    var params = {}, keyvals, temp, i, l;
    keyvals = queryString.split("&");  // Split out key/value pairs
    for ( i = 0, l = keyvals.length; i < l; i++ ) {  // Split key/value strings into a dictionary object
        tmp = keyvals[i].split('=');
        params[tmp[0]] = tmp[1];
    }
    return params;
};

// Step #1: Runs when the user clicks the 'Request Auth Code' button
function codeClick() {

	var appClientId = document.getElementById('client_id').value

	var appRedirectUri=encodeURIComponent(document.getElementById('redirect_uri').value);
	var scope = encodeURIComponent(document.getElementById('scope_list').value);
	var responseType = encodeURIComponent(document.getElementById('response_type').value);
    var nonce = encodeURIComponent(randomString(63));
    var state = encodeURIComponent(randomString(63));

	var codeVerifier = encodeURIComponent(document.getElementById('code_verifier').value);
	var codeChallenge = encodeURIComponent(document.getElementById('code_challenge').value);
    var codeChallengeMethod = encodeURIComponent(document.getElementById('code_challenge_method').value);

    // var requestUrl = `https://webexapis.com/v1/authorize?response_type=${responseType}&scope=${scope}&client_id=${appClientId}&nonce=${nonce}&state=${state}&redirect_uri=${appRedirectUri}&code_challenge=xyzpdq&code_challenge_method=plain`

	//Build the request URL.  The base URL and next 4 items are typically always the same for Webex Teams web apps
	var requestUrl = 'https://webexapis.com/v1/authorize?' + //Webex Teams OAuth2 base URL
		'response_type=' + responseType + '&' + // Requesting the OAuth2 'Authentication Code' flow
		'scope=' + scope + '&' + // Requested permission, i.e. Webex Teams room info
		'state=' + state + '&' +	// Random string for OAuth2 nonce replay protection
		'client_id=' + appClientId + '&' + // The custom app Client ID
		// 'prompt=select_account' + '&' + // Force user to re-authenticate
		// 'login_hint=user@example.com' + '&' +
		'code_challenge=' + codeChallenge + '&' + // PKCE code challenge
		'code_challenge_method=' + codeChallengeMethod + '&' + // PKCE code challenge method
		'redirect_uri=' + appRedirectUri; // The custom app's Redirect URI

	console.log(requestUrl)
    sessionStorage.setItem("client_id", appClientId)
    sessionStorage.setItem("code_verifier", codeVerifier)
	window.location = requestUrl; // Redirect the browser to the OAuth2 kickoff URL
}

// Step #2: On page load, check if the 'code=' query param is present
// If so user has already authenticated, and  page has been reloaded via the Redirect URI
window.onload = function(e) {
	document.getElementById('redirect_uri').value=window.location.href.split(/\?|#/i)[0]; // Detect the current page's base URL

    if(sessionStorage.getItem("client_id")) {
        document.getElementById('client_id').value = sessionStorage.getItem("client_id")        
    }
    if(sessionStorage.getItem("client_secret")) {
        document.getElementById('client_secret').value = sessionStorage.getItem("client_secret")        
    }
    if(sessionStorage.getItem("code_verifier")) {
        document.getElementById('code_verifier').value = sessionStorage.getItem("code_verifier")        
    }

	// Auth code flow
	var params = parseQueryStr(window.location.search.substring(1)); // Parse the query string params into a dictionary
    var hashParams = new URLSearchParams(window.location.hash.substring(1)); // Parse hash fragment

    if (params['error']) { // If the query param 'error' exists, then something went wrong...
        alert('Error requesting auth code: ' + params['error'] + ' / ' + decodeURI(params['error_description']));
    }
    if (hashParams['error']) { // If the query param 'error' exists, then something went wrong...
        alert('Error requesting auth code: ' + hashParams['error'] + ' / ' + decodeURI(hashParams['error_description']));
    }


	if (params['code']) { // If the query param 'code' exists, then...
		document.getElementById('auth_code').value = params['code']; // Display the auth code
		document.getElementById('token_button').disabled = false;  // Reveal the 'Request Access Token' button
	}

	// Implicit flow
    var id_token = hashParams.get('id_token');
	var access_token = hashParams.get('access_token')
	if (id_token) { 
		document.getElementById('id_token').value = id_token;
	}
	if (access_token) { 
		document.getElementById('access_token').value = access_token
	}

}

// Step #3: Fires when the user clicks the 'Request Access Token' button
// Takes the auth code and requests an access token
function tokenClick() {
	var appClientId=encodeURI(document.getElementById('client_id').value);
	var appClientSecret=encodeURI(document.getElementById('client_secret').value);
	var appRedirectUri=encodeURIComponent(document.getElementById('redirect_uri').value);
    var authCode = encodeURIComponent(document.getElementById('auth_code').value)
    var codeVerifier = encodeURIComponent(document.getElementById('code_verifier').value)

	xhttp = new XMLHttpRequest(); // Create an AJAX HTTP request object
	xhttp.onreadystatechange = function() {  // Define a handler, which fires when the request completes
		if (xhttp.readyState == 4) { // If the request state = 4 (completed)...
			if (xhttp.status == 200) { // And the status = 200 (OK), then...
				var authInfo = JSON.parse(xhttp.responseText); // Parse the JSON response into an object
				console.log(JSON.stringify(authInfo))
				document.getElementById('access_token').value = authInfo['access_token']; // Retrieve the access_token field, and display it
                document.getElementById('refresh_token').value = authInfo['refresh_token']; // Retrieve the refresh_token field, and display it
                    document.getElementById('id_token').value = authInfo['id_token']; // Retrieve the refresh_token field, and display it
			} else alert('Error requesting access token: ' + xhttp)
 		}
	}
	// Build the HTML form request body 

    
	var body = 'grant_type=authorization_code&'+  // This is an OAuth2 Authorization Code request
		'redirect_uri='+appRedirectUri+'&'+ // Same custom app Redirect URI 
		'code='+authCode+'&'+ // User auth code retrieved previously
		'client_id='+appClientId+'&'+ // The custom app Client ID
		'code_verifier='+codeVerifier+'&' +
		'client_secret='+appClientSecret; // The custom app Client Secret

		console.log(body)
		xhttp.open('POST', 'https://webexapis.com/v1/access_token', true); // Initialize the HTTP request object for POST to the access token URL
		xhttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded'); // Sending the content as URL-encoded form data
		xhttp.send(body); // Execute the AJAX HTTP request
}