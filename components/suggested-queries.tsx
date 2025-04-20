import { motion } from "framer-motion";
import { Button } from "./ui/button";

export const SuggestedQueries = ({
	handleSuggestionClick,
}: {
	handleSuggestionClick: (suggestion: string) => void;
}) => {
	const suggestionQueries = [
		{
			desktop: "Siapa nasabah dengan pemasukan terbesar",
			mobile: "Siapa nasabah dengan pemasukan terbesar",
		},
	];

	return (
		<motion.div
			key="suggestions"
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			layout
			exit={{ opacity: 0 }}
			className="h-full overflow-y-auto"
		>
			<h2 className="text-lg sm:text-xl font-semibold text-foreground mb-4">
				Coba query ini:
			</h2>
			<div className="flex flex-wrap gap-2">
				{suggestionQueries.map((suggestion, index) => (
					<Button
						key={index}
						className={index > 5 ? "hidden sm:inline-block" : ""}
						type="button"
						variant="outline"
						onClick={() => handleSuggestionClick(suggestion.desktop)}
					>
						<span className="sm:hidden">{suggestion.mobile}</span>
						<span className="hidden sm:inline">{suggestion.desktop}</span>
					</Button>
				))}
			</div>
		</motion.div>
	);
};
