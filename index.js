const express = require("express");
const crypto = require("crypto");
const axios = require("axios");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

// app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let salt_key = process.env.SALT_KEY;
let merchant_id = process.env.MERCHANT_ID;
const PORT = process.env.PORT;

app.get("/", (req, res) => {
  res.send("Hello from SERVER!");
});

app.post("/order", async (req, res) => {
  try {
    let merchantTransactionId = req.body.transactionId;

    const data = {
      merchantId: merchant_id,
      merchantTransactionId: merchantTransactionId,
      name: req.body.name,
      amount: req.body.amount * 100,
      // redirectUrl: `http://localhost:8000/status?id=${merchantTransactionId}`,
      redirectUrl: `http://localhost:5173/`,
      redirectMode: "POST",
      mobileNumber: req.body.phone,
      paymentInstrument: {
        type: "PAY_PAGE",
      },
    };

    const payload = JSON.stringify(data);
    const payloadMain = Buffer.from(payload).toString("base64");
    const keyIndex = 1;
    const string = payloadMain + "/pg/v1/pay" + salt_key;
    const sha256 = crypto.createHash("sha256").update(string).digest("hex");
    const checksum = sha256 + "###" + keyIndex;

    // const prod_URL = "https://api-preprod.phonepe.com/apis/hermes"
    const prod_URL =
      "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay";

    const options = {
      method: "POST",
      url: prod_URL,
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        "X-VERIFY": checksum,
      },
      data: {
        request: payloadMain,
      },
    };

    await axios(options)
      .then(function (response) {
        console.log(response.data);
        return res.json(response.data);
      })
      .catch(function (error) {
        console.log(error);
      });
  } catch (error) {
    console.log(error);
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}...`);
});
