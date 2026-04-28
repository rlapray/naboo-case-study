import { gql } from "graphql-tag";
import ActivityFragment from "@/graphql/fragments/activity";

const GetActivities = gql`
  query GetActivities {
    getActivities {
      ...Activity
    }
  }
  ${ActivityFragment}
`;

export default GetActivities;
