var productId;

// Fetch your Stripe publishable key to initialize Stripe.js
// In practice, you might just hard code the publishable API
// key here.
fetch('/config')
  .then(function (result) {
    return result.json();
  })
  .then(function (json) {
    window.config = json;
    window.stripe = Stripe(config.publicKey);
    populate();
  });

// When the form is submitted...
var submitBtn = document.querySelector('#submit');
submitBtn.addEventListener('click', function (evt) {
  var donation = document.getElementById('donation').value;
  console.log("donation: " + donation);
  var amount = parseInt(donation*100);
  console.log("amount: " + amount);

  // Create the checkout session.
  fetch('/create-checkout-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: amount,
      productId: productId
    }),
  }).then(function (result) {
    return result.json();
  }).then(function (data) {
    // Redirect to Checkout. with the ID of the
    // CheckoutSession created on the server.
    stripe.redirectToCheckout({
      sessionId: data.sessionId,
    })
    .then(function(result) {
      // If redirection fails, display an error to the customer.
      if (result.error) {
        var displayError = document.getElementById('error-message');
        displayError.textContent = result.error.message;
      }
    });
  });
});

// The max and min number of photos a customer can purchase
var MIN_PHOTOS = 0;
var MAX_PHOTOS = 1000;

var quantityInput = document.getElementById('quantity-input');
quantityInput.addEventListener('change', function (e) {
  // Ensure customers only buy between 1 and 10 photos
  if (quantityInput.value < MIN_PHOTOS) {
    quantityInput.value = MIN_PHOTOS;
  }
  if (quantityInput.value > MAX_PHOTOS) {
    quantityInput.value = MAX_PHOTOS;
  }
});

/* Method for changing the product quantity when a customer clicks the increment / decrement buttons */
var addBtn = document.getElementById("add");
var subtractBtn = document.getElementById("subtract");
var updateQuantity = function (evt) {
  if (evt && evt.type === 'keypress' && evt.keyCode !== 13) {
    return;
  }
  var delta = evt && evt.target.id === 'add' && 1 || -1;

  addBtn.disabled = false;
  subtractBtn.disabled = false;

  // Update number input with new value.
  quantityInput.value = parseInt(quantityInput.value) + delta;

  // Disable the button if the customers hits the max or min
  if (quantityInput.value == MIN_PHOTOS) {
    subtractBtn.disabled = true;
  }
  if (quantityInput.value == MAX_PHOTOS) {
    addBtn.disabled = true;
  }

  var amount = config.unitAmount/100;
 var total = (quantityInput.value * amount).toFixed(2);

 console.log("total: " + total);
 console.log("submit: " + document.getElementById('submit').innerHTML);
 document.getElementById('submit').innerHTML = "Buy for $" + total;

};

addBtn.addEventListener('click', updateQuantity);
subtractBtn.addEventListener('click', updateQuantity);

function selected(e,index){
  console.log("element id: " + e.id);
  console.log("index: " + index);
  productId = index;
}

function populate(){
  console.log("populate");
  var test = "potato";
  let products = config.products;
  for (var i = 0; i < products.length; i++) {
    let name = products[i].name;
    let description = products[i].description;
    let image = products[i].images[0];
    let index = i;
    console.log("image: " + image);
    var picture = `<div class="col-sm-4 center" onclick="selected(this,${index})" id="product_${index}">
      <div class="center">
        <section class="container">
        <div>
          <h1>${name}</h1>
          <h4>${description}</h4>
          <div class="pasha-image">
            <img src="${image}" width="140" height="160"/>
          </div>
        </div>
      </section>
    </div>
    </div>
    `;
    $("#pictures").append(picture);
  }
}
