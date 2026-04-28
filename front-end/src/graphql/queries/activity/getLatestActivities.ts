import { gql } from "graphql-tag";
import ActivityFragment from "@/graphql/fragments/activity";

const GetLatestActivities = gql`
  query GetLatestActivities {
    getLatestActivities {
      ...Activity
    }
  }
  ${ActivityFragment}
`;

export default GetLatestActivities;
