import PostgresDB from "../db";

async function getAllProducts() {
  return PostgresDB.select("products.*", "stocks.count")
    .from("products")
    .leftJoin("stocks", "products.id", "stocks.product_id");
}

export { getAllProducts };
