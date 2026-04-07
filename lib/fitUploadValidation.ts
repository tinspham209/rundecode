export const MAX_UPLOAD_SIZE_BYTES = 4 * 1024 * 1024;

const FIT_SIGNATURE = ".FIT";
const ALLOWED_MIME_TYPES = new Set([
	"application/octet-stream",
	"application/vnd.ant.fit",
]);

type FitUploadInput = {
	fileName: string;
	mimeType: string;
	fileSize: number;
	fileBytes: Buffer;
};

type FitUploadValidationSuccess = {
	ok: true;
};

type FitUploadValidationFailure = {
	ok: false;
	status: 400 | 413;
	error: string;
};

export type FitUploadValidationResult =
	| FitUploadValidationSuccess
	| FitUploadValidationFailure;

export function validateFitUpload(
	input: FitUploadInput,
): FitUploadValidationResult {
	const extension = input.fileName.split(".").pop();

	if (!extension || extension !== "fit") {
		return {
			ok: false,
			status: 400,
			error: 'Invalid file type. Accepted extension is ".fit".',
		};
	}

	if (input.fileSize > MAX_UPLOAD_SIZE_BYTES) {
		return {
			ok: false,
			status: 413,
			error: "File is too large. Maximum allowed size is 4MB.",
		};
	}

	if (!ALLOWED_MIME_TYPES.has(input.mimeType)) {
		return {
			ok: false,
			status: 400,
			error: "MIME type is not allowed for FIT uploads.",
		};
	}

	if (!hasFitSignature(input.fileBytes)) {
		return {
			ok: false,
			status: 400,
			error: "Invalid FIT signature marker in file header.",
		};
	}

	return { ok: true };
}

function hasFitSignature(fileBytes: Buffer): boolean {
	if (fileBytes.length < 12) {
		return false;
	}

	const signature = fileBytes.subarray(8, 12).toString("ascii");
	return signature === FIT_SIGNATURE;
}
