import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";

// Lazy-loaded so the religion schedule data (~1.5MB) is code-split out of the
// main calculator bundle and only fetched when /religion is visited.
const ReligionLookup = lazy(() => import("./components/ReligionLookup.jsx"));

createRoot(document.getElementById("root")).render(
	<StrictMode>
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<App />} />
				<Route
					path="/religion"
					element={
						<Suspense
							fallback={
								<div className="h-screen flex items-center justify-center text-gray-500">
									Loading Religion Section finder…
								</div>
							}
						>
							<ReligionLookup />
						</Suspense>
					}
				/>
			</Routes>
		</BrowserRouter>
	</StrictMode>,
);
