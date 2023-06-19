import { S3Event } from "aws-lambda";
import * as AWS from "aws-sdk";
import csvParser from "csv-parser";
import { Transform, TransformCallback } from "stream";

const s3Bucket = new AWS.S3({ region: "us-east-1" });

exports.handler = async function (event: S3Event): Promise<void> {
  console.log("### importFileParser:", JSON.stringify(event));

  for (const record of event.Records) {
    const s3ReadableStream = s3Bucket
      .getObject({
        Bucket: record.s3.bucket.name,
        Key: record.s3.object.key,
      })
      .createReadStream();

    console.log(`File is processing from: ${record.s3.object.key}`);

    await processReadableStream(s3ReadableStream, record);
  }
};

async function processReadableStream(
  stream: NodeJS.ReadableStream,
  record: any
) {
  return new Promise((res, rej) => {
    const transformStream = new Transform({
      objectMode: true,
      transform(
        chunk: any,
        encoding: BufferEncoding,
        callback: TransformCallback
      ) {
        console.log("csv file is parsing: ", JSON.stringify(chunk));
        callback();
      },
    });

    stream
      .pipe(csvParser())
      .pipe(transformStream)
      .on("finish", async () => {
        console.log(`${record.s3.object.key} has finished to process`);

        const bucketName = record.s3.bucket.name;
        const key = decodeURIComponent(
          record.s3.object.key.replace(/\+/g, " ")
        );

        const sourceKey = key.replace("uploaded", "parsed");

        if (key === sourceKey) {
          console.log("This file is already in the 'parsed' folder");
          return res(true);
        }

        try {
          await s3Bucket
            .copyObject({
              CopySource: `${bucketName}/${key}`,
              Bucket: bucketName,
              Key: sourceKey,
            })
            .promise();

          await s3Bucket
            .deleteObject({
              Bucket: bucketName,
              Key: key,
            })
            .promise();
          res(true);
        } catch (error: any) {
          console.error("Error occurred during file moving: ", error.message);
        }
      })
      .on("error", rej);
  });
}
