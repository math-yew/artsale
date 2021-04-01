var productId;
var donation;
var minAmount = 20;
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
    let valueStr = stripCurrency(donValue)+"";
    let amount = valueStr*1;
    donation = (!isNaN(amount)) ? amount : donation;
    // donation = (donation > maxAmount) ? 0 : donation;
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
});
function stripCurrency(donValue) {
  var value = donValue.val().replace(/[^\d]/g,"");
  value = value.replace(/\./,"mm");
  let valueArr = value.split("mm");
  return valueArr.map((e)=>e.replace(".","")).join(".");
}

var submitBtn = document.querySelector('#submit');
submitBtn.addEventListener('click', function (evt) {
  let donValue = $("#donation");
  var donation = stripCurrency(donValue);
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
  $(".product-card").css({"background-color":"#ddd","border":"none"});
  $(".product-card h1").css("color","#2e95ff");
  $("#"+e.id).css({"background-color":"#fff","border":"thick solid #0f0","color":"#0f0"});
  $("#"+e.id + " h1").css("color","#0f0");
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
      <div class="center card-back product-card container" onclick="selected(this,${index})" id="product_${index}">
        <h1>${name}</h1>
        <h4>${description}</h4>
        <div class="pasha-image">
          <img src="${image}" width="95%" height="95%"/>
        </div>
      </div>
    </div>`;
    $("#pictures").append(picture);
  }
  var noPic = `<div class="col-sm-12">
    <div class="center card-back product-card container" onclick="selected(this,3)" style="padding:5px" id="product_3">
      <h1>Donation Only</h1>
      <h4>A donation without buying a picture</h4>
    </div>
  </div>`;
  $("#noPic").append(noPic);
}

function checkStatus(){
  console.log("checkStatus")
  let min = (productId == 3) ? 1 : minAmount;
  amountReady = (donation >= min && donation <= maxAmount) ? true : false;
  productReady = (productId > -1 && productId < config.products.length) ? true :false;
  console.log(amountReady + " : " + productReady);

  if(amountReady && productReady) {
    $("#submit").prop("disabled",false).removeClass("disabled");
  }else {
    $("#submit").prop("disabled",true).addClass("disabled");;
  }

  let message="";
  if(donation > maxAmount){
    message = "Choose a number less than $" + maxAmount;
  }
  if(donation < minAmount && productId < 3){
    message = "Because of shipping costs, we require a minimum of $" + minAmount + " for buying the art print. But smaller amounts are great if you select the 'Donation Only' option.";
  }
  console.log("donation < minAmount && productId < 3");
  console.log(donation +"<"+ minAmount);
  console.log(donation < minAmount);
  console.log(productId < 3);
  console.log("message: " + message);

  $("#error-message").text(message);
}
