"use client";

import React from "react";
import { useEffect } from "react";
import * as ReactLeaflet from "react-leaflet";

type Coordinate = [number, number];

type MapLike = {
	fitBounds: (
		bounds: Coordinate[],
		options: { padding: [number, number]; animate: boolean },
	) => void;
};

type MapContainerProps = {
	children: React.ReactNode;
	bounds: Coordinate[];
	zoom: number;
	center: Coordinate;
	style: React.CSSProperties;
};

type PolylineProps = {
	positions: Coordinate[];
	pathOptions: {
		color: string;
		weight: number;
		opacity: number;
		lineJoin: "round";
		lineCap: "round";
	};
};

type TileLayerProps = {
	url: string;
};

const MapContainer = ReactLeaflet.MapContainer as unknown as React.ComponentType<MapContainerProps>;
const Polyline = ReactLeaflet.Polyline as unknown as React.ComponentType<PolylineProps>;
const TileLayer = ReactLeaflet.TileLayer as unknown as React.ComponentType<TileLayerProps>;
const useMap = ReactLeaflet.useMap as unknown as () => MapLike;

type ActivityRouteMapProps = {
	coordinates: Coordinate[];
};

function FitBounds({ bounds }: { bounds: Coordinate[] }) {
	const map = useMap();

	useEffect(() => {
		map.fitBounds(bounds, { padding: [16, 16], animate: false });
	}, [bounds, map]);

	return null;
}

export function ActivityRouteMap({ coordinates }: ActivityRouteMapProps) {
	if (coordinates.length < 2) {
		return null;
	}

	const bounds = coordinates;

	return (
		<div
			style={{
				height: 180,
				width: "100%",
				borderRadius: 12,
				overflow: "hidden",
				border: "1px solid rgba(255,255,255,0.08)",
			}}
		>
			<MapContainer
				bounds={bounds}
				zoom={13}
				center={coordinates[0]}
				style={{ width: "100%", height: "100%" }}
			>
				<TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
				<Polyline
					positions={coordinates}
					pathOptions={{
						color: "#f97316",
						weight: 4,
						opacity: 0.95,
						lineJoin: "round",
						lineCap: "round",
					}}
				/>
				<FitBounds bounds={bounds} />
			</MapContainer>
		</div>
	);
}
