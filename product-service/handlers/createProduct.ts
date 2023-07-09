import { APIGatewayProxyEvent } from "aws-lambda";
import { buildResponse } from "../utils/buildResponse";
import * as yup from "yup";
import { createProduct } from "../utils/rds-db-utils";
import { IProduct } from "../models/product";

exports.handler = async function (event: APIGatewayProxyEvent) {
  console.log("### getProductByIdEvent:", JSON.stringify(event, null, 2));

  try {
    const body = JSON.parse(event.body as string);

    const { count, ...productData } = body;

    const newProduct = await createProduct(productData as IProduct, count);

    return buildResponse(200, newProduct);
  } catch (err: any) {
    if (err instanceof yup.ValidationError) {
      return buildResponse(400, err.errors.join("; "));
    } else {
      return buildResponse(500, err.message);
    }
  }
};
