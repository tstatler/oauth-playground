// Helper function that generates a random alpha/numeric string
var randomString = function(length) {
    var str = "";
    var range = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for(var i = 0; i < length; i++) {
        str += range.charAt(Math.floor(Math.random() * range.length));
    }
    return str;
}

function parseJwt (token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
};


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

// Step #1: Fires when the user clicks the 'Get Tokens' button
function getTokens() {

	var appClientId = document.getElementById('client_id').value
	var appRedirectUri=encodeURIComponent(document.getElementById('redirect_uri').value);
	var scope = encodeURIComponent(document.getElementById('scope_list').value);
	// var responseType = encodeURIComponent(document.getElementById('response_type').value);
	var responseType=encodeURIComponent(document.querySelector('input[name="responseType"]:checked').value);
    var nonce = encodeURIComponent(randomString(63));
    var state = encodeURIComponent(randomString(63));

	//Build the request URL.  The base URL and next 4 items are typically always the same for Webex Teams web apps
	var requestUrl = 'https://webexapis.com/v1/authorize?' + //Webex Teams OAuth2 base URL
		'response_type=' + responseType + '&' + // Requesting the OAuth2 'Authentication Code' flow
		'scope=' + scope + '&' + // Requested permission, i.e. Webex Teams room info
		'state=' + state + '&' +	// Random string for OAuth2 nonce replay protection
		'client_id=' + appClientId + '&' + // The custom app Client ID
		'nonce=' + nonce + '&' + // Nonce, required for OpenID Connect
		// 'prompt=select_account' + '&' +
		// 'login_hint=jdoe@example.com' + '&' +
		'redirect_uri=' + appRedirectUri; // The custom app's Redirect URI

		// console.log(requestUrl)
	window.location = requestUrl; // Redirect the browser to authorization endpoint
}

// Step #2: On page load, check if the 'code=' query param is present
// If so user has already authenticated, and  page has been reloaded via the Redirect URI
window.onload = function(e) {
	document.getElementById('redirect_uri').value=window.location.href.split(/\?|#/i)[0]; // Detect the current page's base URL

	var params = parseQueryStr(window.location.search.substring(1)); // Parse the query string params into a dictionary
    var hashParams = new URLSearchParams(window.location.hash.substring(1)); // Parse hash fragment

    if (params['error']) { // If the query param 'error' exists, then something went wrong...
        alert('Error requesting auth code: ' + params['error'] + ' / ' + decodeURI(params['error_description']));
    }
    if (hashParams['error']) { // If the query param 'error' exists, then something went wrong...
        alert('Error requesting auth code: ' + hashParams['error'] + ' / ' + decodeURI(hashParams['error_description']));
    }

	var id_token = hashParams.get('id_token');
	var access_token = hashParams.get('access_token')
	if (id_token) { 
		document.getElementById('id_token').value = JSON.stringify(parseJwt(id_token), undefined, 4);
		// var claims = parseJwt(id_token);
	}
	if (access_token) { 
		document.getElementById('access_token').value = access_token
	}

}

