import PostgresDB from "../db";
import { IProduct } from "../models/product";
import { v4 as uuidv4 } from "uuid";

async function getAllProducts() {
  return PostgresDB.select("products.*", "stocks.count")
    .from("products")
    .leftJoin("stocks", "products.id", "stocks.product_id");
}

async function getProductById(productId: string) {
  return PostgresDB.select("products.*", "stocks.count")
    .from("products")
    .leftJoin("stocks", "products.id", "stocks.product_id")
    .where({ "products.id": productId })
    .first();
}

async function createProductInTable(productData: IProduct, count: number) {
  const newProduct = {
    id: uuidv4(),
    ...productData,
  };

  const newProductStock = {
    product_id: newProduct.id,
    count,
  };

  try {
    await PostgresDB.transaction(async (trx) => {
      await trx("products").insert(newProduct);
      await trx("stocks").insert(newProductStock);
    });

    return { ...newProduct, count: newProductStock.count };
  } catch (error: any) {
    console.error("Error occurred during inserting a product: ", error.message);
    throw error;
  }
}

export { getAllProducts, getProductById, createProductInTable };
