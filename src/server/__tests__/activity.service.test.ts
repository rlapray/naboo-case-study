// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { activityService } from "@/server/activities/activity.service";
import { NotFoundError } from "@/server/errors";
import { clearTestDb, startTestDb, stopTestDb } from "./helpers/test-db";

describe("activityService.findOne", () => {
  beforeAll(async () => {
    await startTestDb();
  });

  afterAll(async () => {
    await stopTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  it("throws NotFoundError when the id is not a valid ObjectId (no CastError leak)", async () => {
    await expect(activityService.findOne("badid")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("throws NotFoundError when the id is a well-formed but unknown ObjectId", async () => {
    await expect(
      activityService.findOne("000000000000000000000000"),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
