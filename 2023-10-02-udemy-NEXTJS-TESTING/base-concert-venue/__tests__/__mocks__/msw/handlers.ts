import { rest } from "msw";

import { readFakeData } from "@/__tests__/__mocks__/fakeData";
import { fakeUserReservations } from "@/__tests__/__mocks__/fakeData/userReservations";

export const handlers = [
  rest.get(
    "http://localhost:3000/api/shows/:showId",
    async (_req, res, ctx) => {
      const { fakeShows } = await readFakeData();
      return res(ctx.json({ show: fakeShows[0] }));
    }
  ),
  rest.get(
    "http://localhost:3000/api/users/:userId/reservations",
    async (_req, res, ctx) =>
      res(ctx.json({ userReservations: fakeUserReservations }))
  ),
];
