import { describe, it, expect } from "bun:test";
import * as schema from "@schemas/schema";
import app from "@app";
import {refreshAccessToken} from "@clients/enphase.client";

describe("Main Endpoint", async () => {
    await refreshAccessToken();

    it("should return current data", async () => {
        const res = await app.request("/current");

        expect(res.status).toBe(200);

        const json = await res.json();
        const parsed = schema.getCurrentResponse.safeParse(json);
        if (!parsed.success)
            console.error("ZodError:\n", parsed.error.format());

        expect(parsed.success).toBe(true);
    });

    it("should return valid daily data for a given date", async () => {
        const res = await app.request("/daily/2025-01-01");

        expect(res.status).toBe(200);

        const json = await res.json();
        const parsed = schema.getDailyResponse.safeParse(json);
        if (!parsed.success)
            console.error("ZodError:\n", parsed.error.format());

        expect(parsed.success).toBe(true);
    });

    it("should return lifetime data", async () => {
        const res = await app.request("/lifetime");

        expect(res.status).toBe(200);

        const json = await res.json();
        const parsed = schema.getLifeTimeResponse.safeParse(json);
        if (!parsed.success)
            console.error("ZodError:\n", parsed.error.format());

        expect(parsed.success).toBe(true);
    });
});
