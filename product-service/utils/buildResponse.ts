import { IProduct } from "../models/product";

export const buildResponse = (
  statusCode: number,
  body: IProduct[] | IProduct | string
) => {
  return {
    statusCode,
    headers: {
      "Access-Control-Allow-Credentials": true,
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
    },
    body: JSON.stringify(body),
  };
};
