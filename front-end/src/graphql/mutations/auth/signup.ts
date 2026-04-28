import { gql } from "graphql-tag";

const Signup = gql`
  mutation Signup($signUpInput: SignUpInput!) {
    register(signUpInput: $signUpInput) {
      id
      email
      firstName
      lastName
    }
  }
`;

export default Signup;
