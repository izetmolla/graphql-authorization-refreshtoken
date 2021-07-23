import { AuthenticationError, UserInputError } from "apollo-server-express";
import { and, or, rule, shield } from "graphql-shield";

function getPermissions(user: any) {
  if (user && user["https://awesomeapi.com/graphql"]) {
    return user["https://awesomeapi.com/graphql"].permissions;
  }
  return [];
}

const isAuthenticated = rule()((parent, args, { user, auth }) => {
  if (auth) {
    if (auth === "jwt expired") {
      return new AuthenticationError("jwt expired");
    } else {
      return new AuthenticationError("unauthorized");
    }
  }
  return user !== null;
});

const canReadAnyAccount = rule()((parent, args, { user }) => {
  const userPermissions = getPermissions(user);
  return userPermissions.includes("read:any_account");
});

const canReadOwnAccount = rule()((parent, args, { user }) => {
  const userPermissions = getPermissions(user);
  return userPermissions.includes("read:own_account");
});

const isReadingOwnAccount = rule()((parent, { id }, { user }) => {
  return user && user.sub === id;
});

export const permissions = shield({
  Query: {
    account: or(and(canReadOwnAccount, isReadingOwnAccount), canReadAnyAccount),
    accounts: canReadAnyAccount,
    viewer: isAuthenticated,
  },
});
