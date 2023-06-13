import { APIGatewayProxyEvent } from "aws-lambda";
import { buildResponse } from "../utils/buildResponse";
import * as AWS from "aws-sdk";

const dynamoDB = new AWS.DynamoDB.DocumentClient();

exports.handler = async function (event: APIGatewayProxyEvent) {
  console.log("### getProductByIdEvent:", JSON.stringify(event, null, 2));

  try {
    const productId = event.pathParameters?.productId;

    const productsParams = {
      TableName: process.env.PRODUCTS_TABLE_NAME as string,
      Key: {
        id: productId,
      },
    };

    const stocksParams = {
      TableName: process.env.STOCKS_TABLE_NAME as string,
      Key: {
        product_id: productId,
      },
    };

    const product = await dynamoDB.get(productsParams).promise();
    const stock = await dynamoDB.get(stocksParams).promise();

    if (!product) {
      return buildResponse(404, "Product not found");
    }

    const joinedProduct = {
      ...product.Item,
      count: stock.Item ? stock.Item.count : 0,
    };

    return buildResponse(200, joinedProduct);
  } catch (err: any) {
    return buildResponse(500, err.message);
  }
};
