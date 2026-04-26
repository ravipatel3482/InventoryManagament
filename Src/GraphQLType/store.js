const { GraphQLObjectType, GraphQLSchema } = require('graphql');
const { BourbonQueries, BourbonMutations } = require('./bourbon');
const { ProductQueries, ProductMutations } = require('./Product/product_methods');


const RootQuery = new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
        ...BourbonQueries, // Spread the bourbon queries here
        ...ProductQueries  // Spread the product queries here
    }
});

const Mutation = new GraphQLObjectType({
    name: 'Mutation',
    fields: {
        ...BourbonMutations,
        ...ProductMutations
    }
});

module.exports = new GraphQLSchema({
    query: RootQuery,
    mutation: Mutation
});