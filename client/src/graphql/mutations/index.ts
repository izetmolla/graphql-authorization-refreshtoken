import { gql } from "@apollo/client";

export const LOGIN = gql`
  mutation Mutation($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      access_token
      refresh_token
    }
  }
`;

export const REFRESH_TOKEN = gql`
  mutation RefreshTokenMutation {
    refreshToken {
      access_token
      refresh_token
    }
  }
`;
