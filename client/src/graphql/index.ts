import { setContext } from "@apollo/client/link/context";
import {
  ApolloClient,
  createHttpLink,
  from,
  fromPromise,
  InMemoryCache,
} from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import { REFRESH_TOKEN } from "./mutations";

let isRefreshing: boolean = false;
let pendingRequests: any = [];

const resolvePendingRequests = () => {
  pendingRequests.map((callback: any) => callback());
  pendingRequests = [];
};

const errorLink = onError(
  ({ graphQLErrors, networkError, operation, forward }) => {
    console.log(graphQLErrors);
    if (graphQLErrors) {
      for (let err of graphQLErrors) {
        console.log(err.message);
        switch (err.extensions!.code) {
          case "UNAUTHENTICATED":
            let forward$;

            if (!isRefreshing) {
              isRefreshing = true;
              forward$ = fromPromise(
                client
                  .mutate({
                    mutation: REFRESH_TOKEN,
                    
                  })
                  .then(({ data: { refreshToken } }) => {
                    console.log(refreshToken);
                    localStorage.setItem(
                      "access_token",
                      refreshToken.access_token
                    );
                    return true;
                  })
                  .then(() => {
                    resolvePendingRequests();
                    return true;
                  })
                  .catch(() => {
                    pendingRequests = [];
                    return false;
                  })
                  .finally(() => {
                    isRefreshing = false;
                  })
              );
            } else {
              forward$ = fromPromise(
                new Promise((resolve: any) => {
                  pendingRequests.push(() => resolve());
                })
              );
            }

            return forward$.flatMap(() => forward(operation));
          default:
            console.log(
              `[GraphQL error]: Message: ${err.message}, Location: ${err.locations}, Path: ${err.path}`
            );
        }
      }
    }

    if (networkError) console.log(`[Network error]: ${networkError}`);
  }
);

const httpLink = createHttpLink({
  uri: "http://localhost:4000/graphql",
  //   credentials: "include",
});

const authLink = setContext(async (operation, { headers }) => {
  const token = localStorage.getItem("access_token");
  if (operation.operationName === "RefreshTokenMutation") {
    let refreshToken = localStorage.getItem("refresh_token");
    if (refreshToken) {
      return {
        headers: {
          ...headers,
          authorization: `Bearer ${localStorage.getItem("refresh_token")}`,
        },
      };
    } else {
      return { headers };
    }
  }

  return {
    headers: {
      ...headers,
      authorization: `Bearer ${token}`,
    },
  };
});

const cache = new InMemoryCache();

const client = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache,
});

export default client;
