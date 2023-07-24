require("dotenv").config();
const express = require("express");
const axios = require("axios");
const app = express();
const cors = require("cors");
const morgan = require("morgan");
// const { Agent } = require("https");

app.use(morgan("dev"));

app.use(cors());
app.use(express.json());

app.all("/:service*", async (req, res, next) => {
  console.log("req", req.params);
  if (!req.params.service) {
    return res.status(400).send("Service is not specified in the URL");
  }

  const recipientUrl =
    process.env[req.params.service.toUpperCase() + "_SERVICE_API"];

  if (!recipientUrl) {
    return res.status(502).send("Cannot process request");
  }
  const { authorization, "content-type": contentType } = req.headers;
  const targetUrl = new URL(recipientUrl + req.params[0]);

  console.log("### req.method", req.method);
  console.log("### req.data", req.body);
  try {
    const response = await axios({
      url: targetUrl.toString(),
      headers: {
        authorization,
        "content-type": contentType,
      },
      method: req.method,
      data: req.body,
      // httpsAgent: new Agent({
      //   rejectUnauthorized: false,
      // }),
    });

    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error("Error when making request:", error);
    next(error);
  }
});

app.all("*", (req, res, next) => {
  const error = new Error(`Unmatched route: ${req.method} ${req.path}`);
  error.status = 404;
  next(error);
});

app.use((err, req, res, next) => {
  console.error("#### middleware error: ", err);
  const statusCode = err.status || 500;
  res.status(statusCode).json({ message: err.message });
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
