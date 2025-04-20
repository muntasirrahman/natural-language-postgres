import { Info } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";

export const ProjectInfo = () => {
	return (
		<div className="bg-muted p-4 mt-auto">
			<Alert className="bg-muted text-muted-foreground border-0">
				<Info className="h-4 w-4 text-primary" />
				<AlertDescription>
					This application to allow you to query a database with natural
					language.
				</AlertDescription>
			</Alert>
		</div>
	);
};
