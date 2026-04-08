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
	const { register, handleSubmit, reset } = useForm<UploadForm>();
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [previewMetadata, setPreviewMetadata] = useState<Metadata | null>(null);
	const [parsingPreview, setParsingPreview] = useState(false);
	const parseAbortRef = useRef<AbortController | null>(null);

	const analysis = useAnalysisStore((s) => s.analysis);
	const metadata = useAnalysisStore((s) => s.metadata);
	const loading = useAnalysisStore((s) => s.loading);
	const error = useAnalysisStore((s) => s.error);
	const selectedModel = useAnalysisStore((s) => s.selectedModel);
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

			setResult(payload.analysis, payload.metadata);
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
		<>
			<Card style={{ marginBottom: "1.5rem" }}>
				<div
					style={{
						position: "absolute",
						top: -60,
						right: -60,
						width: 220,
						height: 220,
						borderRadius: "50%",
						background: "rgba(249,115,22,0.10)",
						filter: "blur(60px)",
						pointerEvents: "none",
					}}
				/>

				<CardHeader>
					<div
						style={{
							display: "flex",
							alignItems: "flex-start",
							justifyContent: "space-between",
						}}
					>
						<div>
							<Badge style={{ marginBottom: "0.75rem" }}>
								<Zap size={10} />
								AI-powered
							</Badge>
							<CardTitle>Phân tích buổi chạy thủ công (.fit)</CardTitle>
							<CardDescription>
								Upload file .fit từ Zepp / Amazfit — AI sẽ tạo báo cáo tiếng
								Việt chi tiết cho bạn.
							</CardDescription>
						</div>
					</div>
				</CardHeader>

				<CardContent>
					<form onSubmit={onSubmit}>
						<div
							{...getRootProps()}
							style={{
								borderRadius: 16,
								border: `2px dashed ${isDragActive ? "#f97316" : selectedFile ? "#10b981" : "rgba(255,255,255,0.12)"}`,
								background: isDragActive
									? "rgba(249,115,22,0.06)"
									: selectedFile
										? "rgba(16,185,129,0.05)"
										: "rgba(255,255,255,0.02)",
								padding: "2.5rem 1.5rem",
								textAlign: "center",
								cursor: "pointer",
								transition: "all 0.25s ease",
								boxShadow: isDragActive
									? "0 0 40px rgba(249,115,22,0.18)"
									: "none",
								marginBottom: "1.25rem",
							}}
						>
							<input {...getInputProps()} />

							<input
								id="fit-file"
								aria-label="Upload FIT file"
								type="file"
								accept=".fit"
								style={{
									position: "absolute",
									width: 1,
									height: 1,
									opacity: 0,
									overflow: "hidden",
									clip: "rect(0,0,0,0)",
									whiteSpace: "nowrap",
								}}
								{...register("file")}
								onChange={(event) => {
									const file = event.target.files?.[0] ?? null;
									handleFileSelection(file);
								}}
							/>

							{selectedFile ? (
								<div
									style={{
										display: "flex",
										flexDirection: "column",
										alignItems: "center",
										gap: "0.5rem",
									}}
								>
									<CheckCircle2
										size={44}
										color="#10b981"
										className="animate-glow-pulse"
									/>
									<div
										style={{
											fontWeight: 700,
											color: "#fff",
											fontSize: "1rem",
											marginTop: 4,
										}}
									>
										{selectedFile.name}
									</div>
									<div style={{ fontSize: "0.75rem", color: "#6ee7b7" }}>
										{(selectedFile.size / 1024).toFixed(1)} KB · sẵn sàng phân
										tích
									</div>
								</div>
							) : (
								<div
									style={{
										display: "flex",
										flexDirection: "column",
										alignItems: "center",
										gap: "0.75rem",
									}}
								>
									<div
										style={{
											width: 60,
											height: 60,
											borderRadius: 18,
											background: "rgba(255,255,255,0.05)",
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											border: "1px solid rgba(255,255,255,0.08)",
										}}
									>
										<UploadCloud size={26} color="#94a3b8" />
									</div>
									<div>
										<div
											style={{
												fontWeight: 600,
												color: "#e2e8f0",
												fontSize: "0.95rem",
											}}
										>
											Kéo thả file .fit vào đây
										</div>
										<div
											style={{
												color: "#64748b",
												fontSize: "0.83rem",
												marginTop: 4,
											}}
										>
											hoặc nhấn để chọn từ thiết bị
										</div>
									</div>
								</div>
							)}
						</div>

						{selectedFile && previewMetadata ? (
							<div
								style={{
									marginBottom: "1rem",
									display: "flex",
									flexDirection: "column",
									gap: "0.5rem",
								}}
							>
								<label
									style={{
										fontSize: "0.875rem",
										fontWeight: 500,
										color: "#e2e8f0",
									}}
								>
									Chọn mô hình AI
								</label>
								<select
									value={selectedModel}
									onChange={(e) => setSelectedModel(e.target.value)}
									disabled={loading || parsingPreview}
									style={{
										padding: "0.625rem 0.85rem",
										borderRadius: 8,
										border: "1px solid rgba(255,255,255,0.1)",
										background: "rgba(255,255,255,0.05)",
										color: "#e2e8f0",
										fontSize: "0.875rem",
									}}
								>
									{FREE_MODELS.map((model) => (
										<option
											key={model}
											value={model}
											style={{ background: "#1e293b", color: "#e2e8f0" }}
										>
											{model}
										</option>
									))}
								</select>
							</div>
						) : null}

						<Button
							type="submit"
							disabled={
								loading || parsingPreview || !selectedFile || !previewMetadata
							}
							size="lg"
							className="w-full sm:w-auto"
						>
							{parsingPreview
								? "Đang parse preview..."
								: loading
									? "Đang phân tích..."
									: "Analyze Run"}
						</Button>
					</form>
				</CardContent>
			</Card>

			{parsingPreview ? (
				<LoadingSpinner message="Đang parse file .fit để preview dữ liệu chạy..." />
			) : null}
			{loading ? (
				<LoadingSpinner message="AI đang phân tích dữ liệu chạy của bạn..." />
			) : null}
			{error ? <ErrorAlert message={error} onRetry={retryCurrentStep} /> : null}

			{previewMetadata && !analysis ? (
				<Card style={{ marginBottom: "1.5rem" }}>
					<CardHeader>
						<CardTitle>Preview dữ liệu từ FIT</CardTitle>
						<CardDescription>
							Xác nhận các chỉ số đã đúng trước khi bấm Analyze Run để tiết kiệm
							lượt AI.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<MetadataSidebar metadata={previewMetadata} />
					</CardContent>
				</Card>
			) : null}

			{analysis && metadata ? (
				<AnalysisDisplay
					initialAnalysis={analysis}
					metadata={metadata}
					onReset={resetAnalysis}
				/>
			) : null}
		</>
	);
}
