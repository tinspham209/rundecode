import { NextResponse } from "next/server";
import { parseFitFile, ParseValidationError } from "../../../lib/fitParser";
import { validateFitUpload } from "../../../lib/fitUploadValidation";
import { toRunMetadata } from "../../../lib/runMetadata";

type JsonError = { error: string };

export async function POST(request: Request) {
	try {
		const formData = await request.formData();
		const files = formData.getAll("file");

		if (files.length === 0) {
			return NextResponse.json<JsonError>(
				{ error: "File is required." },
				{ status: 400 },
			);
		}

		if (files.length > 1) {
			return NextResponse.json<JsonError>(
				{ error: "Only one file is supported." },
				{ status: 400 },
			);
		}

		const fileEntry = files[0];
		if (!(fileEntry instanceof File)) {
			return NextResponse.json<JsonError>(
				{ error: "Invalid file payload." },
				{ status: 400 },
			);
		}

		const fileBuffer = Buffer.from(await fileEntry.arrayBuffer());
		const validation = validateFitUpload({
			fileName: fileEntry.name,
			mimeType: fileEntry.type,
			fileSize: fileEntry.size,
			fileBytes: fileBuffer,
		});

		if (!validation.ok) {
			return NextResponse.json<JsonError>(
				{ error: validation.error },
				{ status: validation.status },
			);
		}

		const parsed = await parseFitFile(fileBuffer);

		return NextResponse.json({
			metadata: toRunMetadata(parsed.session),
		});
	} catch (error) {
		if (error instanceof ParseValidationError) {
			return NextResponse.json<JsonError>(
				{ error: error.message },
				{ status: 422 },
			);
		}

		return NextResponse.json<JsonError>(
			{
				error: `Không thể parse file FIT lúc này. Vui lòng thử lại sau. Error: ${error instanceof Error ? error.message : String(error)}`,
			},
			{ status: 500 },
		);
	}
}
