// 🔥 QR DISPLAY FUNCTION (GLOBAL)
function displayQR(qrUrl) {
  const container = document.getElementById("qr-container");

  container.innerHTML = `
    <h3>Your Booking QR</h3>
    <img src="${qrUrl}" width="200"/>
  `;
}


// 🔥 MAIN PAYMENT FUNCTION
window.handlePayment = async function () {
  try {
    console.log("Button clicked ✅");

    // 1️⃣ Create booking + order
    const res = await fetch("http://localhost:5000/api/booking/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stationId: "station123",
        date: "2026-03-25"
      })
    });

    const data = await res.json();
    console.log("Response:", data);

    // ❗ handle backend failure
    if (!res.ok || !data.order) {
      alert("Booking failed: " + (data.message || "Unknown error"));
      return;
    }

    const order = data.order;
    console.log("ORDER FROM BACKEND:", order.id);

    // 2️⃣ Razorpay options
    const options = {
      key: "rzp_test_SVQ4XAJ7F8kFzz",
      amount: order.amount,
      currency: "INR",
      name: "EV-ChargeMate",
      description: "Booking Payment",
      order_id: order.id,

      // 3️⃣ PAYMENT SUCCESS HANDLER
      handler: async function (response) {
        console.log("Payment response:", response);

        const verifyRes = await fetch("http://localhost:5000/api/payment/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(response)
        });

        const verifyData = await verifyRes.json();

        console.log("Verify response:", verifyData);
        console.log("QR VALUE:", verifyData.booking?.qrCode);

        // ❗ safety check
        if ( !verifyData.qrCode) {
          alert("QR not received ❌");
          return;
        }

        alert("Payment Successful 🎉");

        // ✅ Display QR
        displayQR(verifyData.qrCode);
      }
    };

    // 4️⃣ OPEN PAYMENT
    const rzp = new Razorpay(options);
    rzp.open();

  } catch (err) {
    console.error("ERROR ❌", err);
  }
};