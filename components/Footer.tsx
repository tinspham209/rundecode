import React from "react";

const Footer = () => {
	return (
		<footer className="border-t border-gray-800 bg-gray-900 py-4 text-white">
			<div className="container mx-auto max-w-6xl px-4">
				<div className="text-center flex flex-row flex-wrap justify-center gap-4">
					<a href="https://tinspham.dev" target="_blank" rel="noopener">
						@tinspham.dev
					</a>
					|
					<a href="https://tinspham.dev/cv.pdf" target="_blank" rel="noopener">
						View my CV
					</a>
				</div>
			</div>
		</footer>
	);
};

export default Footer;
