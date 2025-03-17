import Image from 'next/image';
let ResolvedImage = Image;
if ('default' in ResolvedImage) {
	ResolvedImage = ResolvedImage.default;
}
import { useState } from 'react';

const FallbackImage = ({ s }) => {
	const [hasError, setHasError] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	const handleError = () => {
		setHasError(true);
		setIsLoading(false);
	};

	const handleLoad = () => {
		setIsLoading(false);
	};

	return (
		<>
			{!hasError && (
				<ResolvedImage
					src={`https://${process.env.NEXT_PUBLIC_OME_EDGE_HOSTNAME}/thumb/${s}/thumb.jpg`}
					width={160}
					height={90}
					unoptimized
					onError={handleError}
					onLoad={handleLoad}
					alt={isLoading ? 'Loading...' : 'Image'} // Show loading text in alt
				/>
			)}
			{hasError && (
				<div style={{ width: 160, height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
					<span>Image not available</span>
				</div>
			)}
		</>
	);
};

export default FallbackImage;
