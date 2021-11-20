import Utilities from "../scripts/utilities.js";
import Cypher from "../scripts/cypher.js";

export default class FileManager {

	constructor() {}

	downloadMatchExportFile(participantService) {
		const participantsJSON = Utilities.objectToJSON(participantService.participants);
		const restrictionsJSON = Utilities.mapOfSetToJSON(participantService.restrictions);
		const matchesJSON = Utilities.mapToJSON(participantService.matches);

		const fileJSON = JSON.stringify({
			participants: participantsJSON,
			restrictions: restrictionsJSON,
			matches: matchesJSON,
			participantCounter: participantService.participantCounter
		});

		const encryptedFileJSON = Cypher.encode(fileJSON);

		const fileName = `backup-amigo-invisivel.json`;
		const fileOptions = { type: `text/plain` };

		const file = new Blob([encryptedFileJSON], fileOptions);
		const link = document.createElement('a');
		link.href = URL.createObjectURL(file);
		link.download = fileName;
		link.click();
	}
}