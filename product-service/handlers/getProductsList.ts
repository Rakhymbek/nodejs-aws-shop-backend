import { products } from "../mocks/productsData";
import { APIGatewayProxyEvent } from "aws-lambda";
import { buildResponse } from "../utils/buildResponse";

exports.handler = async function (event: APIGatewayProxyEvent) {
  try {
    return buildResponse(200, products);
  } catch (err: any) {
    return buildResponse(500, err.message);
  }
};
