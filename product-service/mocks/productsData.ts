import { IProduct } from "../models/product";
import * as yup from "yup";

// mockData from FE-app

export const products: IProduct[] = [
  {
    description: "Short Product Description1",
    id: 1,
    price: 24,
    title: "ProductOne",
    count: 4,
  },
  {
    description: "Short Product Description2",
    id: 2,
    price: 15,
    title: "ProductTwo",
    count: 1,
  },
  {
    description: "Short Product Description3",
    id: 3,
    price: 23,
    title: "ProductThree",
    count: 0,
  },
  {
    description: "Short Product Description4",
    id: 4,
    price: 15,
    title: "ProductFour",
    count: 3,
  },
  {
    description: "Short Product Description5",
    id: 5,
    price: 23,
    title: "ProductFive",
    count: 2,
  },
  {
    description: "Short Product Description6",
    id: 6,
    price: 15,
    title: "ProductSix",
    count: 8,
  },
];

export const productSchema = yup.object({
  title: yup.string().required(),
  description: yup.string().required(),
  price: yup.number().positive().integer().required(),
});

export const stockSchema = yup.object({
  count: yup.number().integer().min(0).required(),
});
