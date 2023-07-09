import knex from "knex";

const dbOptions = {
  host: process.env.PG_HOST as string,
  port: process.env.PG_PORT as string,
  database: process.env.PG_DATABASE as string,
  user: process.env.PG_USERNAME as string,
  password: process.env.PG_PASSWORD as string,
};

export default knex({
  client: "pg",
  connection: dbOptions,
});
