import { describe, expect, it } from "vitest";
import {
	MAX_UPLOAD_SIZE_BYTES,
	validateFitUpload,
} from "../lib/fitUploadValidation";

describe("fit upload validation", () => {
	it("accepts valid .fit with allowed mime and FIT signature", () => {
		const fitHeader = Buffer.from([
			0x0e, 0x10, 0x5d, 0x08, 0, 0, 0, 0, 0x2e, 0x46, 0x49, 0x54,
		]);

		const result = validateFitUpload({
			fileName: "Zepp20260406192022.fit",
			mimeType: "application/octet-stream",
			fileSize: fitHeader.length,
			fileBytes: fitHeader,
		});

		expect(result.ok).toBe(true);
	});

	it("rejects invalid extension", () => {
		const fitHeader = Buffer.from([
			0, 0, 0, 0, 0, 0, 0, 0, 0x2e, 0x46, 0x49, 0x54,
		]);
		const result = validateFitUpload({
			fileName: "activity.tcx",
			mimeType: "application/octet-stream",
			fileSize: fitHeader.length,
			fileBytes: fitHeader,
		});

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.status).toBe(400);
			expect(result.error).toMatch(/\.fit/);
		}
	});

	it("rejects disallowed mime type", () => {
		const fitHeader = Buffer.from([
			0, 0, 0, 0, 0, 0, 0, 0, 0x2e, 0x46, 0x49, 0x54,
		]);
		const result = validateFitUpload({
			fileName: "run.fit",
			mimeType: "text/plain",
			fileSize: fitHeader.length,
			fileBytes: fitHeader,
		});

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.status).toBe(400);
			expect(result.error).toMatch(/MIME/i);
		}
	});

	it("rejects missing FIT signature marker", () => {
		const invalidHeader = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
		const result = validateFitUpload({
			fileName: "run.fit",
			mimeType: "application/octet-stream",
			fileSize: invalidHeader.length,
			fileBytes: invalidHeader,
		});

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.status).toBe(400);
			expect(result.error).toMatch(/signature/i);
		}
	});

	it("rejects file larger than 4MB", () => {
		const result = validateFitUpload({
			fileName: "run.fit",
			mimeType: "application/octet-stream",
			fileSize: MAX_UPLOAD_SIZE_BYTES + 1,
			fileBytes: Buffer.alloc(16),
		});

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.status).toBe(413);
			expect(result.error).toMatch(/large/i);
		}
	});

	it("accepts file exactly at 4MB boundary", () => {
		const validHeader = Buffer.from([
			0x0e, 0x10, 0x5d, 0x08, 0, 0, 0, 0, 0x2e, 0x46, 0x49, 0x54,
		]);
		const result = validateFitUpload({
			fileName: "run.fit",
			mimeType: "application/octet-stream",
			fileSize: MAX_UPLOAD_SIZE_BYTES,
			fileBytes: validHeader,
		});

		expect(result.ok).toBe(true);
	});
});
