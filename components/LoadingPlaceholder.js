import React from "react"
import ContentLoader from "react-content-loader"

const LoadingPlaceholder = (props) => (
	<div className="list-group-item d-flex align-items-center">
		<ContentLoader 
				speed={2}
				width={"100%"}
				height={25}
				viewBox="0 0 100% 25"
				backgroundColor="#d0d0d0"
				foregroundColor="#808080"
				{...props}
			>
				<rect x="25" y="15" width="100%" height="10" />
		</ContentLoader>
	</div>
);

export default LoadingPlaceholder;

