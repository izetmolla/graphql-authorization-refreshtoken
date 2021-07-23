import express from "express";
// import { IResolvers } from "graphql-tools";
import {
  ApolloServerPluginLandingPageLocalDefault,
  ApolloServerPluginLandingPageProductionDefault,
} from "apollo-server-core";
import { ApolloServer, AuthenticationError, gql } from "apollo-server-express";
import jwt from "jsonwebtoken";
import { permissions } from "./permissions";
import { applyMiddleware } from "graphql-middleware";
import {
  AuthMiddleware,
  verifyRefreshToken,
} from "./middlewares/AuthMiddleware";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { IResolvers } from "graphql-middleware/dist/types";

function getBearerToken(token: any) {
  return token && token.split("Bearer ").pop();
}
let accounts: any[] = [
  {
    id: "12345",
    name: "Alice",
    email: "user",
    password: "user",
    roles: ["admin"],
    permissions: ["read:any_account", "read:own_account"],
  },
  {
    id: "67890",
    name: "Bob",
    email: "bob@email.com",
    password: "pAsSWoRd!",
    roles: ["subscriber"],
    permissions: ["read:own_account"],
  },
];
const typeDefs = gql`
  type Account {
    id: ID!
    name: String
  }

  type Query {
    account(id: ID!): Account
    accounts: [Account]
    viewer: Account!
  }
  type Tokens {
    access_token: String
    refresh_token: String
  }

  type Mutation {
    login(email: String!, password: String!): Tokens
    refreshToken: Tokens!
  }
`;

const resolvers: IResolvers = {
  Account: {
    __resolveReference(object) {
      return accounts.find((account) => account.id === object.id);
    },
  },
  Query: {
    account(parent, { id }) {
      return accounts.find((account) => account.id === id);
    },
    accounts() {
      return accounts;
    },
    viewer(parent, args, { user }) {
      return accounts.find((account) => account.id === user.sub);
    },
  },
  Mutation: {
    login(parent, { email, password }) {
      const { id, permissions, roles } = accounts.find(
        (account) => account.email === email && account.password === password
      );
      return {
        access_token: jwt.sign(
          { "https://awesomeapi.com/graphql": { roles, permissions } },
          "f1BtnWgD3VKY",
          { algorithm: "HS256", subject: id, expiresIn: "15s" }
        ),
        refresh_token: jwt.sign(
          { "https://awesomeapi.com/graphql": { roles, permissions } },
          "123",
          { algorithm: "HS256", subject: id, expiresIn: "30d" }
        ),
      };
    },
    refreshToken: async (parent, args, context) => {
      const verify: any = await verifyRefreshToken(
        getBearerToken(context.req.headers.authorization)
      );
      return {
        ...verify,
      };
    },
  },
};

const startServer = async () => {
  const server = new ApolloServer({
    schema: applyMiddleware(
      makeExecutableSchema({ typeDefs, resolvers }),
      permissions
    ),

    plugins: [
      process.env.NODE_ENV === "production"
        ? ApolloServerPluginLandingPageProductionDefault({ footer: false })
        : ApolloServerPluginLandingPageLocalDefault({ footer: false }),
    ],
    context: ({ req }: any) => {
      const user = req.user || null;
      const auth = req.auth || null;
      return { req, user, auth };
    },
    // context: ({ req, res }) => {
    //   const { isAuth, user } = isAuthCheck(req.get("Authorization"));
    //   console.log(isAuth);
    //   return {
    //     isAuth,
    //     user,
    //     req,
    //     res,
    //   };
    // },
    // formatError: (error) => {
    //   // console.log(error);
    //   return error;
    // },
  });
  await server.start();

  const app = express();
  app.use(AuthMiddleware);

  server.applyMiddleware({ app });

  await new Promise((resolve: any) => app.listen({ port: 4000 }, resolve));
  console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`);
  return { server, app };
};
startServer();
