import PostgresDB from "../db";

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

export { getAllProducts, getProductById };
