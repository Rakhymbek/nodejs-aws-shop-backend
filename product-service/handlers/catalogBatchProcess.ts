import { SQSEvent } from "aws-lambda";
import { buildResponse } from "../../import-service/utils/buildResponse";
import { createProduct } from "../utils/createProduct";

exports.handler = async function (event: SQSEvent) {
  console.log("### catalogBatchProcess:", JSON.stringify(event, null, 2));

  try {
    for (const record of event.Records) {
      const body = JSON.parse(record.body);
      const { count, ...productData } = body;
      const newProduct = await createProduct(productData, count);
      console.log("Product created:", newProduct);
    }
    return buildResponse(200, "message is delivered");
  } catch (err: any) {
    return buildResponse(500, err.message);
  }
};
