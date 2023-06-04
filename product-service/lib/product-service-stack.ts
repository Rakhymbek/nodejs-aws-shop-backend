import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import {
  NodejsFunction,
  NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs";
import { HttpLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import * as apiGateway from "@aws-cdk/aws-apigatewayv2-alpha";
import { Construct } from "constructs";

export class ProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const api = new apiGateway.HttpApi(this, "ProductsHttpApi");

    const sharedLambdaProps: NodejsFunctionProps = {
      environment: {},
      runtime: lambda.Runtime.NODEJS_18_X,
    };

    const getProductsListLambda = new NodejsFunction(this, "getProductsList", {
      entry: "handlers/getProductsList.ts",
      ...sharedLambdaProps,
    });

    const getProductsListIntegration = new HttpLambdaIntegration(
      "GetProductsListIntegration",
      getProductsListLambda
    );

    api.addRoutes({
      path: "/products",
      methods: [apiGateway.HttpMethod.GET],
      integration: getProductsListIntegration,
    });
  }
}
