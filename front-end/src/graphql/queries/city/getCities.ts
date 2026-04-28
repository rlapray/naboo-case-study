import { gql } from "graphql-tag";

const GetCities = gql`
  query GetCities {
    getCities
  }
`;

export default GetCities;
