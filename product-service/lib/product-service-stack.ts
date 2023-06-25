import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apiGateway from "@aws-cdk/aws-apigatewayv2-alpha";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as lambdaEventSources from "aws-cdk-lib/aws-lambda-event-sources";
import * as iam from "aws-cdk-lib/aws-iam";
import {
  NodejsFunction,
  NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs";
import { HttpLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import { Construct } from "constructs";

export class ProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const productsTable = new dynamodb.Table(this, "PRODUCTS_TABLE", {
      tableName: "PRODUCTS",
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PROVISIONED,
      readCapacity: 5,
      writeCapacity: 5,
    });

    const stocksTable = new dynamodb.Table(this, "STOCKS_TABLE", {
      tableName: "STOCKS",
      partitionKey: { name: "product_id", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PROVISIONED,
      readCapacity: 5,
      writeCapacity: 5,
    });

    const catalogItemsQueue = new sqs.Queue(this, "CatalogItemsQueue", {
      queueName: "catalog-items-queue",
      visibilityTimeout: cdk.Duration.seconds(15),
    });

    const api = new apiGateway.HttpApi(this, "ProductsHttpApi");

    const sharedLambdaProps: NodejsFunctionProps = {
      environment: {
        PRODUCTS_TABLE_NAME: productsTable.tableName,
        STOCKS_TABLE_NAME: stocksTable.tableName,
      },
      runtime: lambda.Runtime.NODEJS_16_X,
      bundling: {
        minify: true,
        externalModules: ["aws-sdk"],
      },
    };

    const getProductsListLambda = new NodejsFunction(this, "getProductsList", {
      entry: "handlers/getProductsList.ts",
      ...sharedLambdaProps,
    });

    const getProductByIdLambda = new NodejsFunction(this, "getProductById", {
      entry: "handlers/getProductById.ts",
      ...sharedLambdaProps,
    });

    const createProductLambda = new NodejsFunction(this, "createProduct", {
      entry: "handlers/createProduct.ts",
      ...sharedLambdaProps,
    });

    const catalogBatchProcessLambda = new NodejsFunction(
      this,
      "catalogBatchProcess",
      {
        entry: "handlers/catalogBatchProcess.ts",
        ...sharedLambdaProps,
        timeout: cdk.Duration.seconds(10),
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

    productsTable.grantReadWriteData(getProductsListLambda);
    productsTable.grantReadWriteData(getProductByIdLambda);
    productsTable.grantReadWriteData(createProductLambda);

    stocksTable.grantReadWriteData(getProductsListLambda);
    stocksTable.grantReadWriteData(getProductByIdLambda);
    stocksTable.grantReadWriteData(createProductLambda);

    catalogItemsQueue.grantConsumeMessages(catalogBatchProcessLambda);

    catalogBatchProcessLambda.role?.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonDynamoDBFullAccess")
    );
    catalogBatchProcessLambda.addEventSource(
      new lambdaEventSources.SqsEventSource(catalogItemsQueue, { batchSize: 5 })
    );

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
