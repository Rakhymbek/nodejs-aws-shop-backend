import { APIGatewayProxyEvent } from "aws-lambda";
import { buildResponse } from "../utils/buildResponse";
import { getProductById } from "../utils/rds-db-utils";

exports.handler = async function (event: APIGatewayProxyEvent) {
  console.log("### getProductByIdEvent:", JSON.stringify(event, null, 2));

  try {
    const productId = event.pathParameters?.productId;

    if (!productId) {
      return buildResponse(400, "ProductId is required");
    }

    const product = await getProductById(productId as string);

    if (!product) {
      return buildResponse(404, "Product not found");
    }

    return buildResponse(200, product);
  } catch (err: any) {
    return buildResponse(500, err.message);
  }
};
