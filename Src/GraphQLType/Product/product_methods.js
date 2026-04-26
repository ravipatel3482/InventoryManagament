const { ProductType } = require("./product_graphql_type");
const { DepartmentEnum } = require("../../App_Const/department_enum_type");
const { DepartmentType } = require("../Department/department_graphql_type");
const { DistributorEnum } = require("../../App_Const/distributor_enum_type");
// IMPORT PRODUCTS GLOBALLY HERE
const { products:stubProduct } = require("../../Stub_Data/product_data"); 
const  Product = require('../../DataModels/Prodcut/product');
const  InventoryTransaction = require('../../DataModels/Prodcut/InventoryTransaction')
const graphql = require("graphql");
const {
  GraphQLString,
  GraphQLID,
  GraphQLList,
  GraphQLNonNull,
} = graphql;
// RootQuery (Read-only)
const ProductQueries = {
  // Query by Product Name to find who carries it
  // Get everything
  allProducts: {
    type: new GraphQLList(ProductType),
    async resolve() {
      return await Product.find({});
    }
  },
  allDiscontinuedProducts: {
    type: new GraphQLList(ProductType),
    resolve(parent, args) {
      const { products } = require("../../Stub_Data/product_data");
      // Filter only for items that are flagged as discontinued
      return products.filter(p => p.isDiscontinued === true);
    }
  },
  // GetDepartmentData 
  getDepartmentData: {
    type: DepartmentType,
    args: { name: { type: DepartmentEnum } },
    resolve(parent, args) {
      return { name: args.name };
    }
  },
  getAllDepartmentsByCategories: {
    type: new GraphQLList(DepartmentType),
    resolve() {
      const { categories } = require("../../Stub_Data/category_data");
      // 1. Get all unique department names from the categories
      const uniqueDeps = [...new Set(categories.map(c => c.dep))];      
      // 2. Return them as objects so DepartmentType can resolve the 'name' field
      return uniqueDeps.map(depName => ({ name: depName }));
    }
  },
  getAllDepartmentFromEnum: {
    type: new GraphQLList(DepartmentType),
    resolve() {
      // Access the internal values of your DepartmentEnum
      const enumValues = DepartmentEnum.getValues(); 
      
      // Map them into the format DepartmentType expects
      return enumValues.map(enumVal => ({
        name: enumVal.value
      }));
    }
  },
  // Categorty and SubCategory Need to Add Not Required
  // GetProductByDepartment
  getProductByDepartment:{
     type:GraphQLList(ProductType),
     args:{depname: { type:DepartmentEnum}},
     resolve(parent,args){
       const { categories } = require("../../Stub_Data/category_data");
       const { subCategories } = require("../../Stub_Data/subcategory_data");
       const { products } = require("../../Stub_Data/product_data");
       const relevantCats = categories
                          .filter(c => c.dep.toUpperCase() === args.depname.toUpperCase())
                          .map(c => c.id);

      const relevantSubCats = subCategories
        .filter(sc => relevantCats.includes(sc.catId))
        .map(sc => sc.id);

      return products.filter(p => relevantSubCats.includes(p.subCatId));
        }
  },
  // Get Product By Name
  productByName: {
    type: new GraphQLList(ProductType),
    args: { name: { type: GraphQLString } },
    async resolve(parent, args) {
      // return products.filter(p => p.name.toLowerCase().includes(args.name.toLowerCase()));
      return await Product.find({ 
      name: { $regex: args.name, $options: 'i' } 
     });
    }
  },
  // find the distributor for product 
  findDistributorForProduct:{
    type: GraphQLString,
    args: { 
      name: { type: new GraphQLNonNull(GraphQLString) } 
    },
    resolve(parent, args) {
      // Find the first product that matches the name
      const product = products.find(p => 
        p.name.toLowerCase().includes(args.name.toLowerCase())
      );      
      return product ? product.distributor : "Distributor not found";
    }
  },
  findProductsByDistributor: {
    type: new GraphQLList(ProductType),
    args: { distributor: { type: DistributorEnum } }, // e.g., RNDC
    resolve(parent, args) {
      const { products } = require("../../Stub_Data/product_data");    
      // Filter the master list for matching distributors
      return products.filter(p => p.distributor === args.distributor);
    }
  }
};
// Mutation (Write/Change)
const ProductMutations = {
  // Add Product to The Product list
  //  Only This Integrated with MongoDb
  addProduct: {
    type: ProductType,
    args: {
      name: { type: new GraphQLNonNull(GraphQLString) },
      company: { type: new GraphQLNonNull(GraphQLString) },
      distributor: { type: new GraphQLNonNull(DistributorEnum) },
      subCatId: { type: new GraphQLNonNull(GraphQLID) },
      purchase_cost: { type: new GraphQLNonNull(graphql.GraphQLFloat) },
      selling_cost: { type: new GraphQLNonNull(graphql.GraphQLFloat) },
      initialStock: { type: graphql.GraphQLInt } // Added this for your 45 items
    },
    async resolve(parent, args) {
      const { products } = require("../../Stub_Data/product_data");
      const { inventoryTransactions } = require("../../Stub_Data/inventory_data");

      // 1. Create the Product Record
      const newProduct = new Product({
        name: args.name,
        company: args.company,
        distributor: args.distributor,
        subCatId: args.subCatId,
        purchase_cost: args.purchase_cost,
        selling_cost: args.selling_cost
      });
      // Stub Mode
      // products.push(newProduct);
      const savedProduct = await newProduct.save();
      // 2. Create the "INITIAL" transaction so the stock isn't zero
      if (args.initialStock) {
        const newinventoryTransactions = new InventoryTransaction({
          productId: savedProduct._id,
          date: new Date().toISOString(),
          type: "INITIAL",
          quantity: args.initialStock,
          note: "Opening stock for new product"
        });
         // Stub Mode
        // inventoryTransactions.push(newinventoryTransactions)
        await newinventoryTransactions.save();
      }
      return savedProduct;
    }
  },
  // Update Product Update a product from the list
  updateProduct: {
    type: ProductType,
    args: {
      id: { type: new GraphQLNonNull(GraphQLID) },
      name: { type: GraphQLString },
      company: { type: GraphQLString },
      distributor: { type: DistributorEnum },
      selling_cost: { type: graphql.GraphQLFloat },
      // Use this to "set" a new total stock level
      newQuantity: { type: graphql.GraphQLInt },
      isDiscontinued: { type: graphql.GraphQLBoolean }
    },
    resolve(parent, args) {
      const { products } = require("../../Stub_Data/product_data");
      const { inventoryTransactions } = require("../../Stub_Data/inventory_data");

      let product = products.find(p => p.id === args.id);
      if (!product) return null;

      // 1. Update Static Fields
      if (args.name) product.name = args.name;
      if (args.company) product.company = args.company;
      if (args.distributor) product.distributor = args.distributor;
      if (args.selling_cost) product.selling_cost = args.selling_cost;
      if (args.isDiscontinued !== undefined) {
        product.isDiscontinued = args.isDiscontinued;
      }
      // 2. Handle Quantity Adjustment
      if (args.newQuantity !== undefined) {
        // Calculate current stock from history
        const currentStock = inventoryTransactions
          .filter(t => t.productId === args.id)
          .reduce((total, t) => total + t.quantity, 0);

        // Find the difference (Adjustment)
        const adjustmentNeeded = args.newQuantity - currentStock;

        if (adjustmentNeeded !== 0) {
          inventoryTransactions.push({
            productId: args.id,
            date: new Date().toISOString(),
            type: "ADJUSTMENT",
            quantity: adjustmentNeeded,
            note: `Manual stock update to ${args.newQuantity}`
          });
        }
      }
      return product;
    }
  },
  // DELETE: Remove a product from the list 
  deleteProduct: {
    type: ProductType,
    args: {
      id: { type: new GraphQLNonNull(GraphQLID) }
    },
    resolve(parent, args) {
      const index = products.findIndex(p => p.id === args.id);
      if (index !== -1) {
        // splice removes the item and returns it
        const deletedProduct = products.splice(index, 1);
        return deletedProduct[0];
      }
      return null;
    }
  },
  // recive invoice Update the stock 
  receiveInvoice: {
    type: ProductType,
    args: {
      productId: { type: new GraphQLNonNull(GraphQLID) },
      quantityReceived: { type: new GraphQLNonNull(graphql.GraphQLInt) },
      invoiceNumber: { type: GraphQLString },
      costPerItem: { type: graphql.GraphQLFloat } // Optional: track if price changed
    },
    resolve(parent, args) {
      const { inventoryTransactions } = require("../../Stub_Data/inventory_data");
      const { products } = require("../../Stub_Data/product_data");

      // 1. Create the history record (The Audit Trail)
      const newTransaction = {
        id: (inventoryTransactions.length + 1).toString(),
        productId: args.productId,
        date: new Date().toISOString(),
        type: "INVOICE",
        quantity: args.quantityReceived,
        invoiceNumber: args.invoiceNumber
      };
      inventoryTransactions.push(newTransaction);

      // 2. Update the main product's master stock (The current total)
      let product = products.find(p => p.id === args.productId);
      if (product) {
        // We ADD the new quantity to the existing stock
        product.stocks += args.quantityReceived;

        // If the invoice has a new cost, update the purchase_cost too
        if (args.costPerItem) {
          product.purchase_cost = args.costPerItem;
        }

        return product;
      }
      return null;
    }
  }
};

module.exports = { ProductQueries, ProductMutations };