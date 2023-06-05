import { products } from "../mocks/productsData";
import { APIGatewayProxyEvent } from "aws-lambda";
import { buildResponse } from "../utils/buildResponse";

exports.handler = async function (event: APIGatewayProxyEvent) {
  try {
    const productId = event.pathParameters?.productId;
    const product = products.find((product) => product.id === productId);

    if (!product) {
      return buildResponse(404, "Product not found");
    }

    return buildResponse(200, product);
  } catch (err: any) {
    return buildResponse(500, err.message);
  }
};
