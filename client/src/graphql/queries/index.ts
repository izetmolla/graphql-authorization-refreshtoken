import { gql } from "@apollo/client";

export const ME = gql`
  query Query {
    viewer {
      name
    }
  }
`;
