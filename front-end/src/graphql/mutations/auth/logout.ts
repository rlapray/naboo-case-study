import { gql } from "graphql-tag";

const Logout = gql`
  mutation Logout {
    logout
  }
`;

export default Logout;
