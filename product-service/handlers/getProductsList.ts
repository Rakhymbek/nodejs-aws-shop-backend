import {products} from "../mocks/productsData";
import { APIGatewayProxyEvent } from 'aws-lambda';

exports.handler = async function(event: APIGatewayProxyEvent) {
    console.log("request: EVENT", JSON.stringify(event));

    return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(products)
    };
};
