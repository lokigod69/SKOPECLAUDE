import { render, screen } from "@testing-library/react";

import HomePage from "./page";

describe("HomePage", () => {
  it("renders the headline", () => {
    render(<HomePage />);
    expect(screen.getByText(/What brought you here today/i)).toBeInTheDocument();
  });
});
