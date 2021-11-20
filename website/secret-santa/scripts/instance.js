import FileManager from "../services/file-manager.js";
import LocalStorage from "../services/local-storage.js";
import ParticipantService from "../services/participant-service.js";

const participantService = new ParticipantService(true);
const localStorage = new LocalStorage();
var notifyingParticipants = false;
var notifyingParticipant = false;

document.addEventListener('DOMContentLoaded', function () {
	configureStaticEventListeners();

	participantService.loadFromLocalStorage();

	fillStoredParticipants();
});

function configureStaticEventListeners() {
	document.getElementById('confirmResetButton').addEventListener('click', onConfirmResetPressed);
	document.getElementById('confirmRematchButton').addEventListener('click', onConfirmRematchPressed);
	document.getElementById('notifyParticipantsButton').addEventListener('click', onNotifyParticipantsPressed);
	document.getElementById('saveParticipantChanges').addEventListener('click', onSaveParticipantChangesPressed);
	document.getElementById('exportFileButton').addEventListener('click', onExportFilePressed);
}

function fillStoredParticipants() {
	participantService.participants.forEach( (p) => {
		addParticipant(p);
	});
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
	const nameCell = createSimpleCell(participant.name);
	const emailCell = createSimpleCell(participant.email);
	const notificationStatusCell = createSimpleCell(getNotificationStatusHTML(participant));

	const notifyButton = createNotifyParticipantButton();
	const editButton = createEditParticipantButton();
	const toolbar = createIndividualButtonsToolbar([notifyButton, editButton]);
	const actionCell = createCellWithNode(toolbar, 'right');

	const row = document.createElement('tr');
	row.dataset.participantId = participant.id;
	row.append(nameCell, emailCell, notificationStatusCell, actionCell);

	return row;
}

function createSimpleCell(value) {
	const cell = document.createElement('td');
	cell.innerHTML = value;
	return cell;
}

function createCellWithNode(node, alignment = 'left') {
	const cell = document.createElement('td');
	cell.append(node);
	cell.style.textAlign = alignment;
	return cell;
}

function createNotifyParticipantButton() {
	const btn = createNotifyButton();

	btn.addEventListener('click', function (e) {
		const row = e.target.closest('tr');
		onNotifyParticipantPressed(row)
	});

	return btn;
}

function createNotifyButton() {
	const btn = document.createElement('button');
	btn.type = 'button';
	btn.classList = 'btn btn-warning';
	setHTML(btn, `<i class="fas fa-paper-plane"></i>`);

	return btn;
}

function createEditParticipantButton() {
	const btn = createEditButton();

	btn.addEventListener('click', function (e) {
		const row = e.target.closest('tr');
		onEditParticipantPressed(row)
	});

	return btn;
}

function createEditButton() {
	const btn = document.createElement('button');
	btn.type = 'button';
	btn.classList = 'btn btn-info';
	btn.dataset.bsToggle = 'modal';
	btn.dataset.bsTarget = '#editParticipantModal';
	setHTML(btn, `<i class="fas fa-edit"></i>`);

	return btn;
}

function createIndividualButtonsToolbar(buttons) {
	const toolbar = document.createElement('div');
	toolbar.classList = 'btn-toolbar';
	toolbar.setAttribute('role', 'toolbar');

	var counter = 0

	buttons.forEach( button => {
		const buttonGroup = createButtonGroup([button]);

		if (counter++ > 0) {
			buttonGroup.style.marginLeft = '4px';
		}

		toolbar.appendChild(buttonGroup);
	});

	return toolbar;
}

function createButtonGroup(buttons) {
	const btnContainer = document.createElement('div');
	btnContainer.classList = 'btn-group';
	btnContainer.setAttribute('role', 'group');

	buttons.forEach( button => {
		btnContainer.appendChild(button);
	});

	return btnContainer;
}

function onNotifyParticipantPressed(row) {
	if (notifyingParticipant || notifyingParticipants) {
		return;
	}

	notifyingParticipant = true;

	const participantId = parseInt(row.dataset.participantId);

	const notifyButton = row.querySelector('button');
	setNotifyParticipantLoadingAnimation(notifyButton, true);

	participantService.notifyParticipant(participantId).then( _ => {
		onNotifyParticipantSuccess(row);
	})
	.catch( error => {
		onNotifyParticipantFinished(row);
		alert(error);
	})
}

function getNotificationStatusHTML(participant) {
	return participant.wasNotified ? `Yes` : `No`
}

async function onNotifyParticipantSuccess(row) {
	// show success toaster
	onNotifyParticipantFinished(row);
}

function onNotifyParticipantFinished(row) {
	updateParticipantDetails(row);

	const notifyButton = row.querySelector('button');
	setNotifyParticipantLoadingAnimation(notifyButton, false);

	notifyingParticipant = false;
}

function updateParticipantDetails(row) {
	const participantId = parseInt(row.dataset.participantId);
	const participant = participantService.getParticipant(participantId);

	const nameCell = row.querySelectorAll('td')[0];
	setHTML(nameCell, participant.name)

	const contactCell = row.querySelectorAll('td')[1];
	setHTML(contactCell, participant.email)

	const notificationStatusCell = row.querySelectorAll('td')[2];
	setHTML(notificationStatusCell, getNotificationStatusHTML(participant))
}

function onEditParticipantPressed(row) {
	const participantId = parseInt(row.dataset.participantId);
	const participant = participantService.getParticipant(participantId);

	const modal = document.getElementById('editParticipantModal');
	modal.dataset.participantId = participantId;

	setModalInputValue(modal, 'participantName', participant.name);
	setModalInputValue(modal, 'participantEmail', participant.email);
}

function onSaveParticipantChangesPressed() {
	const modal = document.getElementById('editParticipantModal');
	const participantId = parseInt(modal.dataset.participantId);

	const updatedName = getModalNameInputValue(modal, 'participantName');
	const updatedEmail = getModalNameInputValue(modal, 'participantEmail');

	const participant = participantService.getParticipant(participantId);
	participantService.updateParticipantDetails(participant, updatedName, updatedEmail);

	const participantRow = getParticipantRow(participantId);
	updateParticipantDetails(participantRow);

	hideModal(modal);
}

function hideModal(modal) {
	modal.style. classList.add('hidden');
}

function setModalInputValue(modal, name, value) {
	const modalInputs = modal.querySelectorAll('input');

	modalInputs.forEach( input => {
		if (input.name === name) {
			input.value = value;
		}
	});
}

function getModalNameInputValue(modal, name) {
	const modalInputs = modal.querySelectorAll('input');
	var value = undefined;

	modalInputs.forEach( input => {
		if (input.name === name) {
			value = input.value;
		}
	});

	return value;
}

function getParticipantRow(participantId) {
	const table = getParticipantsTableBody();
	const participantRows = table.querySelectorAll('tr');
	var matchingRow = undefined;

	participantRows.forEach( row => {
		if (participantId === parseInt(row.dataset.participantId)) {
			matchingRow = row;
		}
	});

	return matchingRow;
}

async function onNotifyParticipantsPressed() {
	if (notifyingParticipants) {
		return;
	}

	notifyingParticipants = true;
	setNotifyParticipantsLoadingAnimation(true);

	notifyParticipants().then( _ => {
		onNotifyParticipantsSuccess();
	})
	.catch( error => {
		onNotifyParticipantsFinished()
		throw error;
	})
}

async function notifyParticipants() {
	return new Promise( async function(resolve, reject) {
		var retries = 10;
		var success = false;
		var promiseError = undefined;
	
		while (retries > 0 && !success) {
			try {
				await participantService.notifyParticipants();
				success = true;
			}
			catch (error) {
				retries--;
	
				if (retries == 0) {
					promiseError = error;
				}
			}
		}
	
		if (success) {
			resolve();
		}
		else {
			reject(promiseError);
		}
	})
}

async function onNotifyParticipantsSuccess() {
	// show success toaser
	onNotifyParticipantsFinished();
}

function onNotifyParticipantsFinished() {
	updateParticipantsNotificationStatus();
	setNotifyParticipantsLoadingAnimation(false);
	notifyingParticipants = false;
}

function updateParticipantsNotificationStatus() {
	const tableBody = getParticipantsTableBody();
	const participantRows = tableBody.querySelectorAll('tr');

	participantRows.forEach( row => {
		updateParticipantDetails(row);
	});
}

function setNotifyParticipantLoadingAnimation(button, loading) {
	const html = loading ? `<i class="fas fa-spinner fa-spin"></i>` : `<i class="fas fa-paper-plane"></i>`;
	setHTML(button, html)
}

function setNotifyParticipantsLoadingAnimation(loading) {
	const html = loading ? `<i class="fas fa-spinner fa-spin"></i> Notifying participants...` : `Notify participants`;
	setNotifyParticipantsButtonHTML(html);
}

function setNotifyParticipantsButtonHTML(html) {
	const notifyButton = document.getElementById('notifyParticipantsButton');
	setHTML(notifyButton, html);
}

function setHTML(component, html) {
	component.innerHTML = html;
}

function onExportFilePressed() {
	const fileManager = new FileManager();
	fileManager.downloadMatchExportFile(participantService);
}

function printMatches() {
	var matches = "";
	participantService.matches.forEach( (matchId, pId) => {
		const p1 = participantService.getParticipant(pId);
		const p2 = participantService.getParticipant(matchId);

		matches += `${p1.name} is matched with ${p2.name}\n`;
	});

	alert(matches);
}

function onConfirmResetPressed() {
	participantService.clearFromLocalStorage();
	window.location.replace('home.html');
}

function onConfirmRematchPressed() {
	setShouldPerformRematch(true);
	window.location.replace('home.html');
}

function setShouldPerformRematch(value) {
	localStorage.save('rematch', value);
}