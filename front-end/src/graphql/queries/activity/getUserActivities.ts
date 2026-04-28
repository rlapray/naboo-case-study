import { gql } from "graphql-tag";
import ActivityFragment from "@/graphql/fragments/activity";

const GetUserActivities = gql`
  query GetUserActivities {
    getActivitiesByUser {
      ...Activity
    }
  }
  ${ActivityFragment}
`;

export default GetUserActivities;
