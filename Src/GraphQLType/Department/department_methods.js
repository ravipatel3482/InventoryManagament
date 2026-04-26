const graphql = require("graphql");
const {
  GraphQLString,
  GraphQLID,
  GraphQLList,
  GraphQLNonNull,
} = graphql;
// Import your Mongoose Model
const Department = require("../../DataModels/Department/department");
// Import your GraphQL Type
const { DepartmentType } = require("../Department/department_graphql_type");
// RootQuery (Read-only)
const DepartmentRootQueries = {
  allDepartments: {
    type: new GraphQLList(DepartmentType),
    async resolve() {
      // Fetches all departments for your UI selection dropdown
      const data = await Department.find({});
      console.log("Departments found:", data); // Check your terminal/node console
      return data;
    }
  }
}



// Mutation (Write/Change)
const DepartmentMutations = { 
  addDepartment: {
    type: DepartmentType,
    args: {
      name: { type: new GraphQLNonNull(GraphQLString) }
    },
    async resolve(parent, args) {
      // Saves a new department name from the UI
      let department = new Department({
        name: args.name
      });
      const dep = await department.save();
      return dep
    }
  }
}

module.exports = { DepartmentRootQueries, DepartmentMutations };