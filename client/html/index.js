var productId;
var donation;
var minAmount = 20;
var maxAmount = 30000;
var amountReady = false;
var productReady = false;
var showAmount = false;

fetch('/config')
  .then(function (result) {
    return result.json();
  })
  .then(function (json) {
    window.config = json;
    window.stripe = Stripe(config.publicKey);
    populate();
  });

$(document).ready(function() {
  let donValue = $("#donation");
   donValue.focusout(()=>{
     currency(donValue)
   });
  donValue.keyup(()=>{
    currency(donValue)
  });
  $(".disabled").click(()=>{
    console.log("disabled clicked");
  });
});
function currency(donValue){
  let valueStr = stripCurrency(donValue)+"";
  let amount = valueStr*1;
  donation = (!isNaN(amount)) ? amount : donation;
  // donation = (donation > maxAmount) ? 0 : donation;
  let newValue = formatCurrency(valueStr);
  donValue.val(newValue);
  checkStatus();
}
function formatCurrency(valueStr){
  valueReverse = valueStr.toString().split("").reverse();
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
function stripCurrency(donValue) {
  var value = donValue.val().replace(/[^\d]/g,"");
  value = value.replace(/\./,"mm");
  let valueArr = value.split("mm");
  return valueArr.map((e)=>e.replace(".","")).join(".");
}

var submitBtn = document.querySelector('#submit');
submitBtn.addEventListener('click', function (evt) {
  if($("#submit").hasClass("not-ready")){
    checkStatus(true);
    return;
  }
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
  $("#submit").html("Buy");
  checkStatus();
}

function donationOnly() {
  $(".product-card").css({"background-color":"#ddd","border":"none"});
  $(".product-card h1").css("color","#2e95ff");
  productId = (productId == 3) ? null : 3;
  if(productId == 3) {
    $("#pictures").removeClass("showPics");
    setTimeout(()=>{
      $("#pictures").addClass("noPics");
    },10);
    setTimeout(()=>{
      $("#pictures").hide();
    },1000);

    $("#checked").show();
    $("#check").hide();
    $("#product_3").css("color","#0f0");
    $("#submit").html("Donate");
  } else {
    $("#pictures").removeClass("noPics");
    setTimeout(()=>{
      $("#pictures").addClass("showPics");
      $("#pictures").show();
    },10)

    $("#submit").html("Buy");
    $("#checked").hide();
    $("#check").show();
  }
  checkStatus();
}

function populate(){
  var test = "potato";
  let products = config.products;
  for (var i = 0; i < products.length - 1; i++) {
    let name = products[i].name;
    let description = products[i].description;
    let image = products[i].images[0];
    let index = i;
    var picture = `<div class="col-sm-4 pointer">
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
  var noPic = `<div class="col-lg-4 col-md-6 pointer">
    <div class="donation-only" onclick="donationOnly()" id="product_3">
      <h2><img src="./images/check.png" id="check"><img src="./images/checked.png" style="display:none" id="checked">  Donation Only</h2>
    </div>
  </div>`;
  $("#instructions").append(noPic);
}

function checkStatus(submitClicked){
  let min = (productId == 3) ? 1 : minAmount;
  amountReady = (donation >= min && donation <= maxAmount) ? true : false;
  productReady = (productId > -1 && productId != null && productId < config.products.length) ? true :false;
  console.log(amountReady + " : " + productReady);
  console.log(donation + " : " + productId);

  if(productReady && !showAmount){
    $("#donation").val("");
    let time = (productId == 3) ? 1000 : 10;
    setTimeout(()=> nextStep(), time)
    showAmount = true;
  }

  if(amountReady && productReady) {
    $("#submit").removeClass("not-ready").prop("title", "");
  }else {
    $("#submit").addClass("not-ready").prop("title", "Not Ready");
  }

  let message="";

  if(submitClicked && !productReady){
    message = "Select a product";
  } else if(submitClicked && !amountReady){
    message = "Choose a price";
  }
  if(donation > maxAmount){
    let formattedMaxAmount = formatCurrency(maxAmount).toString();
    message = "Choose a number less than " + formattedMaxAmount;
  }
  if(donation > 0 && donation < minAmount && productId < 3){
    message = "Because of shipping costs, we require a minimum of $" + minAmount + " for buying the art print. But smaller amounts are great if you select the 'Donation Only' option.";
  }
  $("#error-message").text(message);

  let product = config.products[productId];
  let productName = (!!product) ? product.name : "Amount";
  let productDesc = (!!product) ? product.description : "";
  $("#productName").text(productName);
  $("#productDesc").text(productDesc);
  if(!productDesc){
    $("#productDesc").hide();
  }else{
    $("#productDesc").show();
  }

}

function nextStep() {
  $("#donationDiv").addClass("fadeIn");
  $("#donationDiv").show();
  $("#donationDiv h2").addClass("pulse");

  window.scrollTo(0,document.body.scrollHeight);
}
