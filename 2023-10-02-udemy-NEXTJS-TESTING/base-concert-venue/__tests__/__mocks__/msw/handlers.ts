import { rest } from "msw";

import { readFakeData } from "@/__tests__/__mocks__/fakeData";
import { fakeUserReservations } from "@/__tests__/__mocks__/fakeData/userReservations";

export const handlers = [
  rest.get("http://localhost:3000/api/shows/:showId", async (req, res, ctx) => {
    const { fakeShows } = await readFakeData();
    const { showId } = req.params;
    return res(ctx.json({ show: fakeShows[Number(showId as string)] }));
  }),
  rest.get(
    "http://localhost:3000/api/users/:userId/reservations",
    async (_req, res, ctx) =>
      res(ctx.json({ userReservations: fakeUserReservations }))
  ),
];
