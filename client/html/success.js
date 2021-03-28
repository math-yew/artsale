var urlParams = new URLSearchParams(window.location.search);
var sessionId = urlParams.get('session_id');

if (sessionId) {
  fetch('/checkout-session?sessionId=' + sessionId)
    .then(function (result) {
      console.log("results: " + JSON.stringify(result));
      return result.json();
    })
    .then(function (session) {
      var sessionJSON = JSON.stringify(session, null, 2);
      console.log(session.shipping);
      let shipping = session.shipping !=null;
      let type = session.shipping !=null ? "PURCHASE!" : "DONATION!"
      document.getElementById("thankyou").innerHTML = "THANKYOU FOR YOUR " + type;
      document.querySelector('pre').textContent = sessionJSON;
    })
    .catch(function (err) {
      console.log('Error when fetching Checkout session', err);
    });
}
