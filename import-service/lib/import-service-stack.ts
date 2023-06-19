import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apiGw from "@aws-cdk/aws-apigatewayv2-alpha";
import * as s3 from "aws-cdk-lib/aws-s3";
import {
  NodejsFunction,
  NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs";
import { HttpLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import { Construct } from "constructs";

import * as dotenv from "dotenv";
dotenv.config();

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = s3.Bucket.fromBucketName(
      this,
      "ImportProductsBucket",
      process.env.BUCKET_NAME as string
    );

    const api = new apiGw.HttpApi(this, "ImportServiceHttpApi");

    const sharedLambdaProps: NodejsFunctionProps = {
      environment: {
        BUCKET_NAME: bucket.bucketName,
      },
      runtime: lambda.Runtime.NODEJS_16_X,
      bundling: {
        minify: true,
        externalModules: ["aws-sdk"],
      },
    };

    const importProductsFileLambda = new NodejsFunction(
      this,
      "importProductsFile",
      {
        entry: "handlers/importProductsFile.ts",
        ...sharedLambdaProps,
      }
    );

    const importProductsFileIntegration = new HttpLambdaIntegration(
      "ImportProductsFileIntegration",
      importProductsFileLambda
    );

    bucket.grantReadWrite(importProductsFileLambda);

    api.addRoutes({
      path: "/import",
      methods: [apiGw.HttpMethod.GET],
      integration: importProductsFileIntegration,
    });
  }
}
