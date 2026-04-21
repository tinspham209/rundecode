"use client";

import React from "react";
import { CheckCircle2, UploadCloud, Zap } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { AnalysisDisplay } from "./AnalysisDisplay";
import { ErrorAlert } from "./ErrorAlert";
import { LoadingSpinner } from "./LoadingSpinner";
import { MetadataSidebar, type Metadata } from "./MetadataSidebar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";
import { FREE_MODELS } from "../lib/aiAnalyzer";
import { useAnalysisStore } from "../stores/analysisStore";
import { useProfileStore } from "../stores/profileStore";

type UploadForm = {
	file: FileList;
};

export function FitUploadPanel() {
	const { handleSubmit, reset } = useForm<UploadForm>();
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [previewMetadata, setPreviewMetadata] = useState<Metadata | null>(null);
	const [parsingPreview, setParsingPreview] = useState(false);
	const parseAbortRef = useRef<AbortController | null>(null);

	const analysis = useAnalysisStore((s) => s.analysis);
	const metadata = useAnalysisStore((s) => s.metadata);
	const loading = useAnalysisStore((s) => s.loading);
	const error = useAnalysisStore((s) => s.error);
	const selectedModel = useAnalysisStore((s) => s.selectedModel);
	const intensityScore = useAnalysisStore((s) => s.intensityScore);
	const recoveryHours = useAnalysisStore((s) => s.recoveryHours);
	const coachingFlags = useAnalysisStore((s) => s.coachingFlags);
	const trainingIntentMatch = useAnalysisStore((s) => s.trainingIntentMatch);
	const setLoading = useAnalysisStore((s) => s.setLoading);
	const setResult = useAnalysisStore((s) => s.setResult);
	const setError = useAnalysisStore((s) => s.setError);
	const setSelectedModel = useAnalysisStore((s) => s.setSelectedModel);
	const resetStore = useAnalysisStore((s) => s.reset);

	const profile = useProfileStore((s) => s.profile);

	const showError = useCallback(
		(message: string) => {
			setError(message);
			toast.error(message);
		},
		[setError],
	);

	const parsePreviewFile = useCallback(
		async (file: File) => {
			parseAbortRef.current?.abort();
			const controller = new AbortController();
			parseAbortRef.current = controller;

			setParsingPreview(true);
			setPreviewMetadata(null);
			setError(null);
			resetStore();

			try {
				const formData = new FormData();
				formData.append("file", file);

				const response = await fetch("/api/parse-fit", {
					method: "POST",
					body: formData,
					signal: controller.signal,
				});

				const payload = await response.json();

				if (!response.ok) {
					showError(payload.error ?? "Không thể parse file để preview.");
					return;
				}

				setPreviewMetadata(payload.metadata);
				setError(null);
			} catch (error) {
				if (error instanceof DOMException && error.name === "AbortError") {
					return;
				}
				showError("Lỗi mạng khi parse preview. Vui lòng thử lại.");
			} finally {
				if (parseAbortRef.current === controller) {
					parseAbortRef.current = null;
				}
				setParsingPreview(false);
			}
		},
		[resetStore, setError, showError],
	);

	const handleFileSelection = useCallback(
		(file: File | null) => {
			setSelectedFile(file);
			setPreviewMetadata(null);
			resetStore();

			if (!file) {
				setError(null);
				return;
			}

			if (!file.name.endsWith(".fit")) {
				showError("Chỉ chấp nhận file .fit");
				return;
			}

			void parsePreviewFile(file);
		},
		[parsePreviewFile, resetStore, setError, showError],
	);

	const onDrop = useCallback(
		(acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
			if (rejectedFiles.length > 0) {
				showError("Chỉ chấp nhận file .fit");
				return;
			}

			const next = acceptedFiles[0] ?? null;
			handleFileSelection(next);
		},
		[handleFileSelection, showError],
	);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		multiple: false,
		accept: {
			"application/octet-stream": [".fit"],
			"application/vnd.ant.fit": [".fit"],
		},
	});

	const onSubmit = handleSubmit(async (values) => {
		const fileFromInput = values.file?.[0] ?? selectedFile;

		if (!fileFromInput) {
			showError("File is required.");
			return;
		}

		if (!fileFromInput.name.endsWith(".fit")) {
			showError("Chỉ chấp nhận file .fit");
			return;
		}

		if (!previewMetadata) {
			showError(
				"Vui lòng chờ parse preview hoàn tất và kiểm tra dữ liệu trước khi Analyze.",
			);
			return;
		}

		setLoading(true);

		try {
			const formData = new FormData();
			formData.append("file", fileFromInput);
			formData.append("model", selectedModel);
			if (profile) {
				formData.append("profile", JSON.stringify(profile));
			}

			const response = await fetch("/api/analyze-fit", {
				method: "POST",
				body: formData,
			});

			const payload = await response.json();
			if (!response.ok) {
				showError(payload.error ?? "Không thể phân tích file.");
				return;
			}

			setResult(payload, payload.metadata);
		} catch {
			showError("Lỗi mạng. Vui lòng thử lại.");
		}
	});

	const resetAnalysis = () => {
		parseAbortRef.current?.abort();
		reset();
		setSelectedFile(null);
		setPreviewMetadata(null);
		setParsingPreview(false);
		resetStore();
	};

	const retryCurrentStep = () => {
		if (selectedFile && !previewMetadata) {
			void parsePreviewFile(selectedFile);
			return;
		}

		void onSubmit();
	};

	return (
		<div className="flex flex-col gap-6">
			<Card className="relative overflow-hidden">
				<div className="absolute -top-[60px] -right-[60px] w-[220px] h-[220px] rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />

				<CardHeader>
					<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
						<div>
							<Badge className="mb-3">
								<Zap size={10} className="mr-1" />
								AI-powered
							</Badge>
							<CardTitle>Phân tích buổi chạy thủ công (.fit)</CardTitle>
							<CardDescription>
								Upload file .fit từ Zepp / Amazfit — AI sẽ tạo báo cáo tiếng
								Việt chi tiết cho bạn.
							</CardDescription>
						</div>

						<div className="flex items-center gap-3">
							<label
								htmlFor="model-select"
								className="text-slate-400 text-sm font-medium"
							>
								Model:
							</label>
							<select
								id="model-select"
								value={selectedModel}
								onChange={(event) => setSelectedModel(event.target.value)}
								className="px-3 py-2 rounded-xl border border-white/15 bg-slate-900/70 text-slate-200 text-xs sm:text-sm focus-visible:ring-1 focus-visible:ring-orange-500/50 outline-none transition-all"
							>
								{FREE_MODELS.map((model) => (
									<option key={model} value={model}>
										{model.split("/").pop()}
									</option>
								))}
							</select>
						</div>
					</div>
				</CardHeader>

				<CardContent>
					<div
						{...getRootProps()}
						className={`
							relative min-h-[180px] rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center p-6 text-center
							${isDragActive ? "border-orange-500/50 bg-orange-500/5" : "border-white/10 hover:border-white/20 hover:bg-white/5"}
						`}
					>
						<input {...getInputProps()} id="fit-file-upload" />
						<label htmlFor="fit-file-upload" className="sr-only">
							Upload .fit file
						</label>
						{selectedFile ? (
							<div className="flex flex-col items-center gap-3 animate-in fade-in zoom-in-95 duration-300">
								<div className="p-4 rounded-full bg-orange-500/10 text-orange-400">
									<CheckCircle2 size={32} />
								</div>
								<div>
									<p className="m-0 font-bold text-slate-100">
										{selectedFile.name}
									</p>
									<p className="m-0 text-sm text-slate-500">
										{(selectedFile.size / 1024).toFixed(1)} KB · Ready to
										analyze
									</p>
								</div>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className="text-slate-400 hover:text-white"
									onClick={(event) => {
										event.stopPropagation();
										handleFileSelection(null);
									}}
								>
									Change file
								</Button>
							</div>
						) : (
							<div className="flex flex-col items-center gap-4">
								<div className="p-4 rounded-full bg-white/5 text-slate-400">
									<UploadCloud size={32} />
								</div>
								<div>
									<p className="m-0 font-bold text-slate-200">
										Click or drag .fit file here
									</p>
									<p className="m-0 text-sm text-slate-500 mt-1">
										Supports Zepp, Amazfit exports (Max 10MB)
									</p>
								</div>
							</div>
						)}
					</div>

					{error && (
						<div className="mt-4">
							<ErrorAlert message={error} onRetry={retryCurrentStep} />
						</div>
					)}

					<div className="mt-6">
						<Button
							type="button"
							onClick={() => void onSubmit()}
							disabled={loading || !selectedFile || !!error || parsingPreview}
							className="w-full py-6 font-bold text-lg bg-gradient-to-br from-orange-500 to-amber-500 border-none rounded-2xl shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 active:scale-[0.99] transition-all"
						>
							{loading ? (
								<div className="flex items-center">
									<LoadingSpinner message="" />
									<span className="ml-2">AI is decoding...</span>
								</div>
							) : parsingPreview ? (
								<div className="flex items-center">
									<LoadingSpinner message="" />
									<span className="ml-2">Checking data...</span>
								</div>
							) : (
								"Phân tích buổi chạy ngay"
							)}
						</Button>
					</div>
				</CardContent>
			</Card>

			<div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
				<div className="order-2 lg:order-1 min-h-[400px]">
					{analysis ? (
						<AnalysisDisplay
							analysis={analysis}
							intensityScore={intensityScore}
							recoveryHours={recoveryHours}
							coachingFlags={coachingFlags}
							trainingIntentMatch={trainingIntentMatch}
							metadata={metadata!}
							onReset={resetAnalysis}
						/>
					) : (
						<div className="h-full flex flex-col items-center justify-center p-12 border-2 border-dashed border-white/5 rounded-3xl bg-black/20 text-slate-500">
							<UploadCloud size={48} className="mb-4 opacity-20" />
							<p className="text-center max-w-[280px]">
								Upload your run data above to see the AI coaching analysis.
							</p>
						</div>
					)}
				</div>

				<div className="order-1 lg:order-2">
					{previewMetadata || metadata ? (
						<MetadataSidebar metadata={(previewMetadata || metadata)!} />
					) : (
						<div className="p-6 rounded-2xl border border-white/5 bg-white/5 text-center">
							<p className="m-0 text-xs text-slate-500 font-medium uppercase tracking-widest">
								Session Preview
							</p>
							<p className="mt-4 text-sm text-slate-600 italic">
								No data loaded yet
							</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
