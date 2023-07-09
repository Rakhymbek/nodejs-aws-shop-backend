import * as AWS from "aws-sdk";
import { SQSEvent } from "aws-lambda";
import { buildResponse } from "../../import-service/utils/buildResponse";
import { createProduct } from "../utils/rds-db-utils";
import { IProduct } from "../models/product";

const sns = new AWS.SNS();

exports.handler = async function (event: SQSEvent) {
  try {
    const newProducts = [];
    for (const record of event.Records) {
      try {
        const body = JSON.parse(record.body);
        const { count, ...productData } = body;
        const newProduct = await createProduct(productData as IProduct, count);
        console.log("Product created:", newProduct);
        newProducts.push(newProduct);
      } catch (e: any) {
        console.error("Error while processing record:", e);
      }
    }

    const SNSParams = {
      Message: `The new products have been created.\r\n${JSON.stringify(
        newProducts
      )}`,
      Subject: "Creation of batch products is completed",
      TopicArn: process.env.SNS_TOPIC_ARN,
    };

    await sns.publish(SNSParams).promise();

    return buildResponse(200, "message is delivered");
  } catch (err: any) {
    return buildResponse(500, err.message);
  }
};
