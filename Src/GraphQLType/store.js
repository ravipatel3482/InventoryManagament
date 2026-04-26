const { GraphQLObjectType, GraphQLSchema } = require('graphql');
const { BourbonQueries, BourbonMutations } = require('./bourbon');
const { ProductQueries, ProductMutations } = require('./Product/product_methods');
const {DepartmentRootQueries,DepartmentMutations} = require('./Department/department_methods')

console.log(DepartmentRootQueries)
console.log(DepartmentMutations)
const RootQuery = new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
        ...BourbonQueries, 
        ...ProductQueries,
        ...DepartmentRootQueries
    }
});

const Mutation = new GraphQLObjectType({
    name: 'Mutation',
    fields: {
        ...BourbonMutations,
        ...ProductMutations,
        ...DepartmentMutations
    }
});

module.exports = new GraphQLSchema({
    query: RootQuery,
    mutation: Mutation
});