const graphql = require("graphql");
const { allProducts } = require("../../Stub_Data/product_import")
const { products } = require('../../Stub_Data/product_data')
const { DistributorEnum } = require("../../App_Const/distributor_enum_type")
const { DepartmentType, SubCategoryType, CategoryType  }= require("../Department/department_graphql_type")
const { DepartmentEnum } = require("../../App_Const/department_enum_type")
const { subLists } = require("../product_type_sublist")
const { InventoryTransactionType } = require('../inventorytranscation_graphql_type')
const _ = require('lodash')
const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLID,
  GraphQLList,
  GraphQLEnumType,
} = graphql;

// The Generic Product Type
const ProductType = new GraphQLObjectType({
  name: 'Product',
  fields: () => ({
    id: { type: GraphQLID },
    name: { type: GraphQLString },
    company: { type: GraphQLString },
    isDiscontinued: { type: graphql.GraphQLBoolean },
    purchase_cost: { type: graphql.GraphQLFloat },
    selling_cost: { type: graphql.GraphQLFloat },
    // Calculated Field: Markup %
    // Formula: ((Selling - Purchase) / Purchase) * 100
    markup: {
      type: graphql.GraphQLString,
      resolve(parent) {
        if (!parent.purchase_cost || parent.purchase_cost === 0) return "0%";
        const markupVal = ((parent.selling_cost - parent.purchase_cost) / parent.purchase_cost) * 100;
        return `${markupVal.toFixed(2)}%`;
      }
    },
    // Calculated Field: Margin %
    // Formula: ((Selling - Purchase) / Selling) * 100
    margin: {
      type: graphql.GraphQLString,
      resolve(parent) {
        if (!parent.selling_cost || parent.selling_cost === 0) return "0%";
        const marginVal = ((parent.selling_cost - parent.purchase_cost) / parent.selling_cost) * 100;
        return `${marginVal.toFixed(2)}%`;
      }
    },
    // 1. Direct link to SubCategory
    subCategory: {
      type: SubCategoryType,
      resolve(parent) {
        const { subCategories } = require("../../Stub_Data/subcategory_data");
        return subCategories.find(sc => sc.id === parent.subCatId);
      }
    },
    // 2. Convenience link to Category (Optional but helpful)
    category: {
      type: CategoryType,
      resolve(parent) {
        const { subCategories } = require("../../Stub_Data/subcategory_data");
        const { categories } = require("../../Stub_Data/category_data");
        const subCat = subCategories.find(sc => sc.id === parent.subCatId);
        return categories.find(c => c.id === subCat.catId);
      }
    },

    // 3. Convenience link to Department
    department: {
      type: DepartmentType,
      resolve(parent) {
        const { subCategories } = require("../../Stub_Data/subcategory_data");
        const { categories } = require("../../Stub_Data/category_data");
        // Follow the breadcrumbs: Product -> SubCat -> Cat -> Dep
        const subCat = subCategories.find(sc => sc.id === parent.subCatId);
        if (!subCat) return null;

        const cat = categories.find(c => c.id === subCat.catId);
        if (!cat) return null;

        return { name: cat.dep }; // Returns the Department Enum value
      }
    },
    distributor: { type: DistributorEnum },
    stocks: {
      type: graphql.GraphQLInt,
      async resolve(parent) {
        // const { inventoryTransactions } = require("../../Stub_Data/inventory_data");
        // return inventoryTransactions
        //   .filter(t => t.productId === parent.id)
        //   .reduce((total, t) => total + t.quantity, 0);
        const InventoryTransaction = require('../../DataModels/Prodcut/InventoryTransaction');
        const transactions = await InventoryTransaction.find({ productId: parent._id });
        return transactions.reduce((total, t) => total + t.quantity, 0);
      }
    },
    inventory_history: {
      type: new GraphQLList(InventoryTransactionType),
      resolve(parent) {
        // Filter transactions for this specific product
        const { inventoryTransactions } = require("../../Stub_Data/inventory_data");
        return inventoryTransactions.filter(t => t.productId === parent.id);
      }
    },
  })
});
module.exports = {
  ProductType
};