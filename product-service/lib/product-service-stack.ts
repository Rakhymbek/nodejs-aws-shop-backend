import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apiGateway from "@aws-cdk/aws-apigatewayv2-alpha";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as sns from "aws-cdk-lib/aws-sns";
import * as subscriptions from "aws-cdk-lib/aws-sns-subscriptions";
import * as lambdaEventSources from "aws-cdk-lib/aws-lambda-event-sources";
import * as iam from "aws-cdk-lib/aws-iam";
import {
  NodejsFunction,
  NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs";
import { HttpLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import { Construct } from "constructs";
import * as dotenv from "dotenv";
dotenv.config();

export class ProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const catalogItemsQueue = new sqs.Queue(this, "CatalogItemsQueue", {
      queueName: "catalog-items-queue",
      visibilityTimeout: cdk.Duration.seconds(30),
    });

    const createProductTopic = new sns.Topic(this, "CreateProductTopic", {
      topicName: "PRODUCT-TOPIC",
      displayName: "product-creation-topic",
    });

    createProductTopic.addSubscription(
      new subscriptions.EmailSubscription(
        process.env.SUBSCRIPTION_EMAIL as string
      )
    );

    const api = new apiGateway.HttpApi(this, "ProductsHttpApi", {
      corsPreflight: {
        allowHeaders: ["*"],
        allowMethods: [apiGateway.CorsHttpMethod.ANY],
        allowOrigins: ["*"],
      },
    });

    const lambdaRole = new iam.Role(this, "LambdaRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
    });

    const statement = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        "ec2:DescribeNetworkInterfaces",
        "ec2:CreateNetworkInterface",
        "ec2:DeleteNetworkInterface",
        "ec2:DescribeInstances",
        "ec2:AttachNetworkInterface",
      ],
      resources: ["*"],
    });

    const sqsStatement = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        "sqs:ReceiveMessage",
        "sqs:DeleteMessage",
        "sqs:GetQueueAttributes",
      ],
      resources: [catalogItemsQueue.queueArn],
    });

    lambdaRole.addToPolicy(sqsStatement);

    lambdaRole.addToPolicy(statement);

    lambdaRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonRDSFullAccess")
    );
    lambdaRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSLambdaBasicExecutionRole"
      )
    );

    const sharedLambdaProps: NodejsFunctionProps = {
      environment: {
        SNS_TOPIC_ARN: createProductTopic.topicArn,
        PG_HOST: process.env.PG_HOST as string,
        PG_PORT: process.env.PG_PORT as string,
        PG_DATABASE: process.env.PG_DATABASE as string,
        PG_USERNAME: process.env.PG_USERNAME as string,
        PG_PASSWORD: process.env.PG_PASSWORD as string,
      },
      runtime: lambda.Runtime.NODEJS_16_X,
      bundling: {
        minify: true,
        externalModules: [
          "aws-sdk",
          "pg-native",
          "mysql",
          "sqlite3",
          "tedious",
          "better-sqlite3",
          "mysql2",
          "pg-query-stream",
          "oracledb",
        ],
      },
    };

    const getProductsListLambda = new NodejsFunction(this, "getProductsList", {
      role: lambdaRole,
      entry: "handlers/getProductsList.ts",
      ...sharedLambdaProps,
    });

    const getProductByIdLambda = new NodejsFunction(this, "getProductById", {
      role: lambdaRole,
      entry: "handlers/getProductById.ts",
      ...sharedLambdaProps,
    });

    const createProductLambda = new NodejsFunction(this, "createProduct", {
      role: lambdaRole,
      entry: "handlers/createProduct.ts",
      ...sharedLambdaProps,
    });

    const catalogBatchProcessLambda = new NodejsFunction(
      this,
      "catalogBatchProcess",
      {
        functionName: "catalogBatchProcessLambda",
        role: lambdaRole,
        entry: "handlers/catalogBatchProcess.ts",
        ...sharedLambdaProps,
        timeout: cdk.Duration.seconds(30),
      }
    );

    const getProductsListIntegration = new HttpLambdaIntegration(
      "GetProductsListIntegration",
      getProductsListLambda
    );

    const getProductByIdIntegration = new HttpLambdaIntegration(
      "GetProductByIdIntegration",
      getProductByIdLambda
    );

    const createProductIntegration = new HttpLambdaIntegration(
      "CreateProductIntegration",
      createProductLambda
    );

    catalogItemsQueue.grantConsumeMessages(catalogBatchProcessLambda);

    catalogBatchProcessLambda.addEventSource(
      new lambdaEventSources.SqsEventSource(catalogItemsQueue, { batchSize: 5 })
    );

    createProductTopic.grantPublish(catalogBatchProcessLambda);

    api.addRoutes({
      path: "/products",
      methods: [apiGateway.HttpMethod.GET],
      integration: getProductsListIntegration,
    });

    api.addRoutes({
      path: "/products/{productId}",
      methods: [apiGateway.HttpMethod.GET],
      integration: getProductByIdIntegration,
    });

    api.addRoutes({
      path: "/products",
      methods: [apiGateway.HttpMethod.POST],
      integration: createProductIntegration,
    });
  }
}
