import {
  APIGatewayAuthorizerResult,
  Callback,
  CustomAuthorizerResult,
} from "aws-lambda";
import { CustomAuthorizerEvent } from "./types";

const generatePolicy = (
  principalId: string,
  effect: string,
  resource: string
): APIGatewayAuthorizerResult => {
  return {
    principalId,
    policyDocument: {
      Version: "2012-10-07",
      Statement: [
        { Action: "execute-api:Invoke", Effect: effect, Resource: resource },
      ],
    },
  };
};

exports.handler = async function (
  event: CustomAuthorizerEvent,
  _context,
  callback: Callback<CustomAuthorizerResult>
) {
  if (event.type !== "TOKEN") {
    callback("Unauthorized");
    return;
  }
  try {
    const authorizationToken = event.authorizationToken;
    if (typeof authorizationToken !== "string") {
      callback("Unauthorized");
      return;
    }
    const encodedCreds = authorizationToken?.split(" ")[1];
    const buffer = Buffer.from(encodedCreds as string, "base64");
    const [username, password] = buffer.toString("utf-8").split(":");

    const storedUserPassword = process.env[username];
    const effect =
      !storedUserPassword || storedUserPassword !== password ? "Deny" : "Allow";

    if (effect === "Deny") {
      callback(null, generatePolicy(username, effect, "*"));
      return;
    }

    return callback(null, generatePolicy(username, "Allow", event.methodArn));
  } catch (err: any) {
    console.error("Error occurred during authorization: ", err);
    callback("Unauthorized");
  }
};
