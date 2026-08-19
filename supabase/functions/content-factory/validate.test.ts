import { describe, expect, it } from "vitest";
import { generatePieceSchema } from "./validate.ts";

const IDEA_ID = "11111111-1111-1111-1111-111111111111";
const FORMAT_ID = "22222222-2222-2222-2222-222222222222";

describe("generatePieceSchema", () => {
  it("aceita idea_id e format_id válidos", () => {
    const result = generatePieceSchema.safeParse({
      idea_id: IDEA_ID,
      format_id: FORMAT_ID,
    });
    expect(result.success).toBe(true);
  });

  it("recusa idea_id que não é uuid", () => {
    const result = generatePieceSchema.safeParse({
      idea_id: "não-é-uuid",
      format_id: FORMAT_ID,
    });
    expect(result.success).toBe(false);
  });

  it("recusa format_id ausente", () => {
    const result = generatePieceSchema.safeParse({ idea_id: IDEA_ID });
    expect(result.success).toBe(false);
  });
});
