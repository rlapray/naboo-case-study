import { gql } from "graphql-tag";
import ActivityFragment from "@/graphql/fragments/activity";

const GetActivity = gql`
  query GetActivity($id: String!) {
    getActivity(id: $id) {
      ...Activity
    }
  }
  ${ActivityFragment}
`;

export default GetActivity;
