import { render, screen } from "@testing-library/react";

import { readFakeData } from "@/__tests__/__mocks__/fakeData";
import BandComponent from "@/pages/bands/[bandId]";

test("band component displays correct band information", async () => {
  const { fakeBands } = await readFakeData();
  render(<BandComponent band={fakeBands[0]} error={null} />);

  const heading = screen.getByRole("heading", {
    name: /the wandering bunnies/i,
  });
  expect(heading).toBeInTheDocument();
});

test("band component displays error message", async () => {
  render(<BandComponent band={null} error="error message" />);

  const errorHeading = screen.getByRole("heading", {
    name: /could not retrieve band data: error message/i,
  });
  expect(errorHeading).toBeInTheDocument();
});
