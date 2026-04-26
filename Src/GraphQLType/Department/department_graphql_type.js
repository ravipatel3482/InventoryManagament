const { 
  GraphQLObjectType, GraphQLString, GraphQLID, 
  GraphQLInt, GraphQLFloat, GraphQLList 
} = require("graphql");

const { DepartmentEnum } = require('../../App_Const/department_enum_type')
const { CategoryEnum } = require('../../App_Const/category_enum_type');
const { SubCategoryEnum } = require('../../App_Const/subcategory_enum_type')
// --- 1. Department Type (The Top) ---
const DepartmentType = new GraphQLObjectType({
  name: 'Department',
  fields: () => ({
    id: { type: GraphQLID },
    name: { type: GraphQLString },
    categories: {
      type: new GraphQLList(CategoryType),
      resolve(parent) {
        const { categories } = require("../../Stub_Data/category_data");
        return categories.filter(c => c.dep === parent.name);
      }
    } 
  })
});

// --- 2. Category Type (Middle - Injects Department) ---
const CategoryType = new GraphQLObjectType({
  name: 'Category',
  fields: () => ({
    id: { type: GraphQLID },
    name: { type: CategoryEnum },
    department: { type: DepartmentType,
            resolve(parent) {
                return { name: parent.dep };
            }
     },
     subCategories: {
      type: new GraphQLList(SubCategoryType),
      resolve(parent) {
        const { subCategories } = require("../../Stub_Data/subcategory_data");
        return subCategories.filter(sc => sc.catId === parent.id);
      }
     }
  })
});

// --- 3. SubCategory Type (Bottom - Injects Category) ---
const SubCategoryType = new GraphQLObjectType({
  name: 'SubCategory',
  fields: () => ({
    id: { type: GraphQLID },
    name: { type: SubCategoryEnum },
    category: { 
        type: CategoryType,     
        resolve(parent) {
                const { categories } = require("../../Stub_Data/category_data");
                return categories.find(c => c.id === parent.catId);
        }
    } // Nested Relation
  })
});

module.exports = { DepartmentType , CategoryType , SubCategoryType }