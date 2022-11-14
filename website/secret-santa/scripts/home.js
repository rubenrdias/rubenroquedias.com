import ParticipantService from "../services/participant-service.js";
import Utilities from "./utilities.js";
import LocalStorage from "../services/local-storage.js";
import Cypher from "./cypher.js";

const participantService = new ParticipantService();
const localStorage = new LocalStorage();
let generatingParticipantMatches = false;

document.addEventListener('DOMContentLoaded', function () {
	configureStaticEventListeners();

	if (shouldPerformRematch()) {
		participantService.loadFromLocalStorage();

		fillRematchParticipants();
		fillRematchParticipantRestrictions();
	}

	localStorage.deleteAll();
});

function configureStaticEventListeners() {
	document.getElementById('uploadMatchFile').addEventListener('click', onUploadMatchFilePressed);
	document.getElementById('addParticipantButton').addEventListener('click', onAddParticipantPressed);
	document.getElementById('addRestrictionButton').addEventListener('click', onAddRestrictionPressed);
	document.getElementById('generateButton').addEventListener("click", onGeneratePressed);
}

function fillRematchParticipants() {
	participantService.participants.forEach( (p) => {
		addNewParticipant(p);
	});
}

function fillRematchParticipantRestrictions() {
	participantService.restrictions.forEach( (restrictionMap, p1Id) => {
		restrictionMap.forEach( p2Id => {
			const p1 = participantService.getParticipant(p1Id);
			const p2 = participantService.getParticipant(p2Id);

			addNewRestriction(p1, p2);
		})
	});
}

function getRestrictionRow(p1Id, p2Id) {
	const table = document.getElementById('tableRestrictions');
	
	if (table === null || table === undefined) {
		return undefined;
	}

	const tbody = table.getElementsByTagName('tbody').item(0);
	const rows = tbody.querySelectorAll('tr');

	let result = undefined;
	
	rows.forEach( row => {
		if (result !== undefined) {
			return 
		}

		const rowP1Id = parseInt(row.dataset.participant1Id);
		const rowP2Id = parseInt(row.dataset.participant2Id);

		if (rowP1Id === p1Id && rowP2Id === p2Id) {
			result = row;
		}
	});

	return result;
}

function onAddParticipantPressed(e) {
	e.preventDefault();

	try {
		const name = getNewParticipantName();
		const email = getNewParticipantEmail();
		const newParticipant = participantService.addParticipant(name, email);
		
		addNewParticipant(newParticipant);
	} 
	catch (error) {
		alert(error);
	}
}

function addNewParticipant(participant) {
	if (!participantsTableExists()) {
		createAndShowParticipantsTable();
	}

	addParticipant(participant);
	addParticipantRestrictionOptions(participant);
	clearNewParticipantDetails();
}

function getNewParticipantName() {
	const nameFormInput = document.getElementById('participantName');
	return nameFormInput.value;
}

function getNewParticipantEmail() {
	const emailFormInput = document.getElementById('participantEmail');
	return emailFormInput.value;
}

function clearNewParticipantDetails() {
	const nameFormInput = document.getElementById('participantName');
	const emailFormInput = document.getElementById('participantEmail');

	nameFormInput.value = null;
	emailFormInput.value = null;
}

function participantsTableExists() {
	return document.getElementById('tableParticipants') !== null;
}

function createAndShowParticipantsTable() {
	const table = document.createElement('table');
	table.id = 'tableParticipants';
	table.classList = 'table table-condensed';
	table.innerHTML = '<tbody></tbody>';
	
	const theadHTML = 
	`<tr>
		<th scope="col" class="col-4">Nome</th>
		<th scope="col" class="col">Contacto</th>
		<th scope="col" class="col-1"></th>
	</tr>`;

	const thead = table.createTHead();
	thead.innerHTML = theadHTML;

	const tableContainer = document.getElementById('participantsTableContainer');
	tableContainer.appendChild(table);
}

function addParticipant(p) {
	const participantsTable = getParticipantsTableBody();
	const row = createParticipantRow(p);
	participantsTable.appendChild(row);
}

function getParticipantsTableBody() {
	const table = document.getElementById('tableParticipants');
	return table.getElementsByTagName('tbody').item(0);
}

function createParticipantRow(participant) {
	const nameCell = createSimpleCell(participant.name, true);
	const emailCell = createSimpleCell(participant.email);

	const deleteButton = createDeleteParticipantButton();
	const actionCell = createCellWithNode(deleteButton, 'right');

	const row = document.createElement('tr');
	row.dataset.participantId = participant.id;
	row.append(nameCell, emailCell, actionCell);

	return row
}

function createSimpleCell(value, isFirstRow = false) {
	const cell = document.createElement('td');
	setHTML(cell, value);
	cell.scope = isFirstRow ? `row` : undefined;
	return cell;
}

function createCellWithNode(node, alignment = 'left') {
	const cell = document.createElement('td');
	cell.append(node);
	cell.style.textAlign = alignment;
	return cell;
}

function createDeleteParticipantButton() {
	const btn = createDeleteButton();

	btn.addEventListener('click', function (e) {
		const row = e.target.closest('tr');
		onDeleteParticipantPressed(row)
	});

	return btn;
}

function createDeleteButton() {
	const btn = document.createElement('button');
	btn.type = 'button';
	btn.classList = 'btn btn-danger';
	setHTML(btn, `<i class="fas fa-trash"></i>`);

	return btn;
}

function addParticipantRestrictionOptions(p) {
	const selectParticipant1 = document.getElementById('selectParticipant1');
	const selectParticipant2 = document.getElementById('selectParticipant2');

	addRestrictionOptionRow(selectParticipant1, p);
	addRestrictionOptionRow(selectParticipant2, p);
}

function addRestrictionOptionRow(selectElement, participant) {
	const option = document.createElement('option');
	setHTML(option, `${participant.name}`);
	option.value = participant.id;

	selectElement.add(option);
}

function onDeleteParticipantPressed(row) {
	const participantId = parseInt(row.dataset.participantId);
	const participant = participantService.getParticipant(participantId);

	removeParticipantRow(row);
	removeParticipantRestrictionOptions(participantId);
	removeParticipantRestrictions(participantId);
	participantService.removeParticipant(participant);
}

function removeParticipantRow(row) {
	const tableBody = row.closest('tbody');
	tableBody.removeChild(row);

	if (tableBody.childNodes.length === 0) {
		removeParticipantsTable();
	}
}

function removeParticipantsTable() {
	const tableContainer = document.getElementById('participantsTableContainer');
	const table = document.getElementById('tableParticipants');
	tableContainer.removeChild(table);
}

function removeParticipantRestrictionOptions(participantId) {
	const selectParticipant1 = document.getElementById('selectParticipant1');
	const selectParticipant2 = document.getElementById('selectParticipant2');

	removeRestrictionOptionRow(selectParticipant1, participantId);
	removeRestrictionOptionRow(selectParticipant2, participantId);
}

function removeRestrictionOptionRow(selectElement, participantId) {
	const optionIndex = getParticipantOptionIndex(selectElement, participantId);
	selectElement.remove(optionIndex);
}

function getParticipantOptionIndex(selectElement, participantId) {
	for (let i=1; i < selectElement.options.length; i++) {
		const option = selectElement[i];

		if (option.value === `${participantId}`) {
			return i;
		}
	}
}

function removeParticipantRestrictions(participantId) {
	participantService.restrictions.forEach ( (restrictionSet, p1Id) => {
		restrictionSet.forEach( p2Id => {
			let restrictionRow = undefined;

			if (p1Id === participantId) {
				restrictionRow = getRestrictionRow(participantId, p2Id);
			}
			else if (p2Id === participantId) {
				restrictionRow = getRestrictionRow(p1Id, participantId);
			}

			if (restrictionRow !== undefined) {
				onDeleteRestrictionPressed(restrictionRow);
			}
		});
	});
}

function onAddRestrictionPressed(e) {
	e.preventDefault();

	const selectParticipant1 = document.getElementById('selectParticipant1');
	const selectParticipant2 = document.getElementById('selectParticipant2');

	const p1 = getSelectedParticipant(selectParticipant1);
	const p2 = getSelectedParticipant(selectParticipant2);

	if (p1 === undefined || p2 === undefined) {
		alert(`Please select two participants`);
		return;
	}

	try {
		participantService.setParticipantRestriction(p1.id, p2.id);
		addNewRestriction(p1, p2);
	}
	catch (error) {
		alert(error);
	}
}

function addNewRestriction(p1, p2) {
	if (!restrictionsTableExists()) {
		createAndShowRestrictionsTable();
	}
	
	addRestriction(p1, p2);
	clearRestrictionSelection();
}

function restrictionsTableExists() {
	return document.getElementById('tableRestrictions') !== null;
}

function createAndShowRestrictionsTable() {
	const table = document.createElement('table');
	table.id = 'tableRestrictions';
	table.classList = 'table table-condensed';
	table.innerHTML = '<tbody></tbody>';
	
	const theadHTML = 
	`<tr>
		<th scope="col" class="col-4">Participante 1</th>
		<th scope="col" class="col">Participante 2</th>
		<th scope="col" class="col-1"></th>
	</tr>`;

	const thead = table.createTHead();
	thead.innerHTML = theadHTML;

	const tableContainer = document.getElementById('restrictionsTableContainer');
	tableContainer.appendChild(table);
}

function addRestriction(p1, p2) {
	const restrictionsTable = getRestrictionsTableBody();
	const row = createRestrictionRow(p1, p2);
	restrictionsTable.appendChild(row);
}

function getRestrictionsTableBody() {
	const table = document.getElementById('tableRestrictions');
	return table.getElementsByTagName('tbody').item(0);
}

function getSelectedParticipant(selectElement) {
	const participantId = parseInt(selectElement.value);
	return participantService.getParticipant(participantId);
}

function createRestrictionRow(p1, p2) {
	const p1Cell = createSimpleCell(p1.name);
	const p2Cell = createSimpleCell(p2.name);

	const deleteButton = createDeleteRestrictionButton();
	const actionCell = createCellWithNode(deleteButton, 'right');

	const row = document.createElement('tr');
	row.dataset.participant1Id = `${p1.id}`;
	row.dataset.participant2Id = `${p2.id}`;
	row.append(p1Cell, p2Cell, actionCell);

	return row
}

function createDeleteRestrictionButton() {
	const btn = createDeleteButton();

	btn.addEventListener('click', function (e) {
		const row = e.target.closest('tr');
		onDeleteRestrictionPressed(row)
	});

	return btn;
}

function resetSelectedOption(selectElement) {
	selectElement.selectedIndex = 0;
}

function onDeleteRestrictionPressed(row) {
	const participant1Id = parseInt(row.dataset.participant1Id);
	const participant2Id = parseInt(row.dataset.participant2Id);

	participantService.removeParticipantRestriction(participant1Id, participant2Id);
	removeRestrictionRow(row);
}

function removeRestrictionRow(row) {
	const tableBody = row.closest('tbody');
	tableBody.removeChild(row);
	
	if (tableBody.childNodes.length === 0) {
		removeRestrictionsTable();
	}
}

function removeRestrictionsTable() {
	const tableContainer = document.getElementById('restrictionsTableContainer');
	const table = document.getElementById('tableRestrictions');
	tableContainer.removeChild(table);
}

function clearRestrictionSelection() {
	const selectParticipant1 = document.getElementById('selectParticipant1');
	const selectParticipant2 = document.getElementById('selectParticipant2');

	resetSelectedOption(selectParticipant1);
	resetSelectedOption(selectParticipant2);
}

async function onGeneratePressed() {
	if (generatingParticipantMatches) {
		return;
	}

	generatingParticipantMatches = true;

	setGenerateButtonLoadingAnimation(true);

	let retries = 1000;
	let success = false;

	while (retries > 0 && !success) {
		try {
			await participantService.matchParticipants();
			success = true;
		}
		catch (error) {
			retries--;

			if (retries == 0) {
				alert(error);
			}
		}
	}

	if (success) {
		onMatchGenerationSuccess();
	}

	setGenerateButtonLoadingAnimation(false);
	generatingParticipantMatches = false;
}

function setGenerateButtonLoadingAnimation(loading) {
	const button = document.getElementById('generateButton');
	const html = loading ? `<i class="fas fa-spinner fa-spin"></i> A sortear...` : `Sortear`;
	setHTML(button, html)
}

function onMatchGenerationSuccess() {
	participantService.saveToLocalStorage();
	window.location.replace('instance.html');
}

function onUploadMatchFilePressed(e) {
	e.preventDefault();

	const fileElement = document.querySelector(`#file`);
	const file = fileElement.files[0]

	if (file === undefined) {
		alert(`No file was selected.`);
		return;
	}

	let reader = new FileReader();
	reader.onload = onMatchFileLoaded;
	reader.readAsText(file);
}

async function onMatchFileLoaded(e) {
	const encodedContent = e.target.result;
	const decodedContent = Cypher.decode(encodedContent);
	const jsonData = JSON.parse(decodedContent);

	validateMatchImportedFile(jsonData);
	
	const uploadButton = document.getElementById('uploadMatchFile');
	setUploadLoadingAnimation(uploadButton, true);

	const startTime = new Date();

	loadImportedMatchData(jsonData);
	
	await Utilities.waitForMinimumTime(2000, startTime);

	onMatchGenerationSuccess();
	setUploadLoadingAnimation(uploadButton, false);
}

function loadImportedMatchData(jsonData) {
	const participantsJSON = jsonData.participants;
	const restrictionsJSON = jsonData.restrictions;
	const matchesJSON = jsonData.matches;
	const participantCounter = jsonData.participantCounter;

	participantService.participants = Utilities.jsonToObject(participantsJSON);
	participantService.restrictions = Utilities.jsonToMapOfSet(restrictionsJSON, 'int', 'int');
	participantService.matches = Utilities.jsonToMap(matchesJSON, 'int');
	participantService.participantCounter = participantCounter;
}

function setUploadLoadingAnimation(button, loading) {
	const html = loading ? `<i class="fas fa-spinner fa-spin"></i> A importar...` : `Importar`;
	setHTML(button, html)
}

function validateMatchImportedFile(jsonData) {
	let isValid = true;

	if (jsonData.participants === undefined ||
		jsonData.restrictions === undefined || 
		jsonData.matches === undefined || 
		jsonData.participantCounter === undefined) 
	{
		isValid = false;
	}

	if (!isValid) {
		throw `O ficheiro importado não tem o formato esperado.`;
	}
}

function setHTML(component, html) {
	component.innerHTML = html;
}

function shouldPerformRematch() {
	const value = localStorage.get('rematch');

	if (value === undefined || value === null || value === 'false') {
		return false
	}
	else {
		return true;
	}
}