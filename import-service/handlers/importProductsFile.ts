import { APIGatewayProxyEvent } from "aws-lambda";
import { buildResponse } from "../utils/buildResponse";
import * as AWS from "aws-sdk";

const s3Bucket = new AWS.S3({ region: "us-east-1" });

exports.handler = async function (event: APIGatewayProxyEvent) {
  const fileName = event.queryStringParameters?.name;

  if (!fileName) {
    return buildResponse(400, "File name is required");
  }

  const bucketParams = {
    Bucket: process.env.BUCKET_NAME,
    Key: `uploaded/${fileName}`,
    Expires: 60,
    ContentType: "text/csv",
  };

  try {
    const signedUrl = await s3Bucket.getSignedUrlPromise(
      "putObject",
      bucketParams
    );

    return buildResponse(200, signedUrl);
  } catch (err: any) {
    return buildResponse(500, err.message);
  }
};
