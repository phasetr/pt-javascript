import { readFakeData } from "@/__tests__/__mocks__/fakeData";
import { filenames, writeJSONToFile } from "@/lib/db/db-utils";

export const resetDB = async () => {
  // fail safe against resetting production db
  const safeToReset = process.env.NODE_ENV === "test";
  if (!safeToReset) {
    console.log("WARNING: database reset unavailable outside of test environment");
    return;
  }

  const { fakeShows, fakeBands, fakeUsers, fakeReservations } = await readFakeData();
  // overwrite data in files
  await Promise.all([
    writeJSONToFile(filenames.bands, fakeBands),
    writeJSONToFile(filenames.reservations, fakeReservations),
    writeJSONToFile(filenames.shows, fakeShows),
    writeJSONToFile(filenames.users, fakeUsers)
  ]);
};
