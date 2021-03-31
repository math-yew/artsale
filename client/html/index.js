var productId;
var donation;
var maxAmount = 30000;
var amountReady = false;
var productReady = false;

console.log("started")

fetch('/config')
  .then(function (result) {
    return result.json();
  })
  .then(function (json) {
    window.config = json;
    window.stripe = Stripe(config.publicKey);
    populate();
  });

$("donation").blur(()=>console.log("asdf"));

$(document).ready(function() {
  let donValue = $("#donation");
   donValue.focusout(()=>{
     currency()
   });
  donValue.keyup(()=>{
    currency()
  });
  function currency(){
    let valueStr = stripCurrency()+"";
    let amount = valueStr*1;
    donation = (!isNaN(amount)) ? amount : donation;
    donation = (donation > maxAmount) ? 0 : donation;
    let newValue = formatCurrency(valueStr);
    donValue.val(newValue);
    checkStatus();
  }
  function formatCurrency(valueStr){
    valueReverse = valueStr.split("").reverse();
    let tempArr = [];
    let count = 0;
    for(var i=0; i<valueReverse.length; i++){
      let char = valueReverse[i];
      count++;
      if(count > 3 && (i < valueReverse.length)){
        tempArr.push(",");
        count = 1;
      }
      tempArr.push(char);
    }
    tempArr.push("$");
    return tempArr.reverse().join("");
  }
  function stripCurrency() {
    var value = donValue.val().replace(/[^\d]/g,"");
    value = value.replace(/\./,"mm");
    let valueArr = value.split("mm");
    return valueArr.map((e)=>e.replace(".","")).join(".");
  }
});

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
    stripe.redirectToCheckout({
      sessionId: data.sessionId,
    })
    .then(function(result) {
      if (result.error) {
        var displayError = document.getElementById('error-message');
        displayError.textContent = result.error.message;
      }
    });
  });
});

function selected(e,index){
  productId = index;
  $(".product-card").css({"background-color":"#fff","border":"thin solid #ccc"});
  $("#"+e.id).css({"background-color":"#efe","border":"thick solid #0f0"});
  let buttonName = (index == 3) ? "Donate" : "Buy";
  $("#submit").html(buttonName);
  checkStatus();
}

function populate(){
  console.log("populate");
  var test = "potato";
  let products = config.products;
  for (var i = 0; i < products.length - 1; i++) {
    let name = products[i].name;
    let description = products[i].description;
    let image = products[i].images[0];
    let index = i;
    console.log("image: " + image);
    var picture = `<div class="col-sm-4">
      <div class="center white-back product-card container" onclick="selected(this,${index})" id="product_${index}">
        <h1>${name}</h1>
        <h4>${description}</h4>
        <div class="pasha-image">
          <img src="${image}" width="140" height="160"/>
        </div>
      </div>
    </div>`;
    $("#pictures").append(picture);
  }
  var noPic = `<div class="col-sm-12">
    <div class="center white-back product-card container" onclick="selected(this,3)" style="padding:5px" id="product_3">
      <h1>Donation</h1>
      <h4>A donation without buying a picture</h4>
    </div>
  </div>`;
  $("#noPic").append(noPic);
}

function checkStatus(){
  console.log("checkStatus")
  amountReady = (donation > 0 && donation <= maxAmount) ? true : false;
  productReady = (productId > -1 && productId < config.products.length) ? true :false;
  console.log(amountReady + " : " + productReady);
  if(amountReady && productReady) {
    $("#submit").prop("disabled",false).removeClass("disabled");
    // $("#submit");
  }else {
    $("#submit").prop("disabled",true).addClass("disabled");;
  }
  console.log("disabled?: " + $("#submit").prop("disabled"));
}
