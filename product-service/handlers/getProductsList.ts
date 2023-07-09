import { APIGatewayProxyEvent } from "aws-lambda";
import { buildResponse } from "../utils/buildResponse";
import { getAllProducts } from "../utils/rds-db-utils";

exports.handler = async function (event: APIGatewayProxyEvent) {
  console.log("### getProductsListEvent:", JSON.stringify(event, null, 2));

  try {
    const products = await getAllProducts();
    return buildResponse(200, products);
  } catch (err: any) {
    return buildResponse(500, err.message);
  }
};
