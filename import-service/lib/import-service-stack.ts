import * as cdk from "aws-cdk-lib";
import { aws_s3_notifications } from "aws-cdk-lib";
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
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";

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

    const importFileParsePolicy = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket",
      ],
      resources: [bucket.bucketArn, `${bucket.bucketArn}/*`],
    });

    const importProductsFileLambda = new NodejsFunction(
      this,
      "importProductsFile",
      {
        entry: "handlers/importProductsFile.ts",
        ...sharedLambdaProps,
      }
    );

    const importFileParserLambda = new NodejsFunction(
      this,
      "importFileParser",
      {
        entry: "handlers/importFileParser.ts",
        ...sharedLambdaProps,
      }
    );

    const importProductsFileIntegration = new HttpLambdaIntegration(
      "ImportProductsFileIntegration",
      importProductsFileLambda
    );

    bucket.grantReadWrite(importProductsFileLambda);

    bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new aws_s3_notifications.LambdaDestination(importFileParserLambda),
      { prefix: "uploaded/" }
    );

    importFileParserLambda.addToRolePolicy(importFileParsePolicy);

    api.addRoutes({
      path: "/import",
      methods: [apiGw.HttpMethod.GET],
      integration: importProductsFileIntegration,
    });
  }
}
