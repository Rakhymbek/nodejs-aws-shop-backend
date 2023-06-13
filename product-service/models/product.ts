export interface IProduct {
  description: string;
  id: number;
  price: number;
  title: string;
  count: number;
}

export interface IStock {
  product_id: number;
  count: number;
}
