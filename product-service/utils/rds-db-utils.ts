import PostgresDB from "../db";
import { IProduct } from "../models/product";
import { productSchema, stockSchema } from "../mocks/productsData";

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

async function createProduct(productData: IProduct, count: number) {
  const validatedProductData = await productSchema.validate(productData);
  const validatedStockData = await stockSchema.validate({ count });

  const newProduct = { ...validatedProductData };

  await PostgresDB.transaction(async (trx) => {
    const [insertedProduct] = await trx("products")
      .insert(newProduct)
      .returning("*");

    const newProductStock = {
      product_id: insertedProduct.id,
      count: validatedStockData.count,
    };

    await trx("stocks").insert(newProductStock);
  });

  return { ...newProduct, count: validatedStockData.count };
}

export { getAllProducts, getProductById, createProduct };
