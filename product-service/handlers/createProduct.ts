import { APIGatewayProxyEvent } from "aws-lambda";
import { buildResponse } from "../utils/buildResponse";
import * as AWS from "aws-sdk";
import { v4 as uuid } from "uuid";
import * as yup from "yup";
import { productSchema, stockSchema } from "../mocks/productsData";

const dynamoDB = new AWS.DynamoDB.DocumentClient();

exports.handler = async function (event: APIGatewayProxyEvent) {
  console.log("### getProductByIdEvent:", JSON.stringify(event, null, 2));

  try {
    const body = JSON.parse(event.body as string);

    const { count, ...productData } = body;

    const validatedProductData = await productSchema.validate(productData);
    const validatedStockData = await stockSchema.validate({ count });

    const newProductId = uuid();

    const newProduct = {
      TableName: process.env.PRODUCTS_TABLE_NAME as string,
      Item: { id: newProductId, ...validatedProductData },
    };

    const newProductStock = {
      TableName: process.env.STOCKS_TABLE_NAME as string,
      Item: { product_id: newProductId, count: validatedStockData.count },
    };

    await dynamoDB
      .transactWrite({
        TransactItems: [{ Put: newProduct }, { Put: newProductStock }],
      })
      .promise();

    return buildResponse(200, { ...newProduct.Item, ...newProductStock.Item });
  } catch (err: any) {
    if (err instanceof yup.ValidationError) {
      return buildResponse(400, err.errors.join("; "));
    } else {
      return buildResponse(500, err.message);
    }
  }
};
