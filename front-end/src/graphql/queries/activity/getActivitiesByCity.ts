import { gql } from "graphql-tag";
import ActivityFragment from "@/graphql/fragments/activity";

const GetActivitiesByCity = gql`
  query GetActivitiesByCity($activity: String, $city: String!, $price: Int) {
    getActivitiesByCity(activity: $activity, city: $city, price: $price) {
      ...Activity
    }
  }
  ${ActivityFragment}
`;

export default GetActivitiesByCity;
