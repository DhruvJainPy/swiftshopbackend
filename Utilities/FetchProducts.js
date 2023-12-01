const Product = require("../Models/ProductModel");
const { FETCH_PRODUCTS } = process.env;

async function fetchProducts() {
  const data = await fetch(FETCH_PRODUCTS);
  const products = await data.json();
  products.map(async (product) => {
    const newProduct = new Product({
      title: product.title,
      description: product.description,
      price: product.price * 82.02,
      discount: product.discountPercentage,
      rating: product.rating.rate,
      stock: product.rating.count,
      category: product.category,
      image: product.image,
    });
    await newProduct.save();
  });
}

fetchProducts();
