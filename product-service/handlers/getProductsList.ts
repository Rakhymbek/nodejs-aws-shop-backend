import { APIGatewayProxyEvent } from "aws-lambda";
import { buildResponse } from "../utils/buildResponse";
import * as AWS from "aws-sdk";

import { IProduct } from "../models/product";

const dynamoDB = new AWS.DynamoDB.DocumentClient();

exports.handler = async function (event: APIGatewayProxyEvent) {
  console.log("### getProductsListEvent:", JSON.stringify(event, null, 2));

  try {
    const productsParams = {
      TableName: process.env.PRODUCTS_TABLE_NAME as string,
    };

    const stocksParams = {
      TableName: process.env.STOCKS_TABLE_NAME as string,
    };

    const products = await dynamoDB.scan(productsParams).promise();
    const stocks = await dynamoDB.scan(stocksParams).promise();

    const joinedProducts = products.Items?.map((product) => {
      const productStock = stocks.Items?.find(
        (stock) => product.id === stock.product_id
      );

      return {
        ...product,
        count: productStock ? productStock.count : 0,
      };
    });

    return buildResponse(200, joinedProducts as IProduct[]);
  } catch (err: any) {
    return buildResponse(500, err.message);
  }
};
