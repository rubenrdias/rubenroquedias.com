import Participant from "../models/participant.js";
import Utilities from "../scripts/utilities.js";
import PairGenerator from "../services/pair-generator.js";
import LocalStorage from "./local-storage.js";

export default class ParticipantService {

	storageService = new LocalStorage();

	matches = new Map(); // Map<Int, Int> // Map <Participant1Id, Participant1Id>
	restrictions = new Map(); // Map<Int, Array<Int>> // Map<ParticipantId, [Participant1Id, ...]>
	participantCounter = 1;
	participants = []; // Array<Participant>

	constructor() {}
	
	getParticipant(id) {
		return this.participants.find( p => { return p.id === id });
	}

	getParticipantByEmail(email) {
		return this.participants.find( p => { return p.email === email });
	}
	
	addParticipant(name, email) {
		this.validateParticipantDetails(name, email);

		const newParticipant = new Participant(this.participantCounter++, name, email);
		this.participants.push(newParticipant);

		return newParticipant;
	}

	validateParticipantDetails(name, email) {
		const isValidName = name != undefined && name != null && name != "";
		const isValidEmail = email != undefined && email != null && email != "";
	
		if (!isValidName) {
			throw `Nome inválido.`;
		}
		else if (!isValidEmail) {
			throw `Email inválido.`;
		}

		const emailExists = this.getParticipantByEmail(email) != undefined;

		if (emailExists) {
			throw `Este email já está a ser usado.`;
		}
	}
	
	removeParticipant(participant) {
		const index = this.participants.findIndex( p => p.id === participant.id );

		if (index !== undefined) {
			this.participants.splice(index, 1);
		}
	}
	
	getParticipantRestrictons(participantId) {
		const participantRestrictions = this.restrictions.get(participantId);
		
		if (participantRestrictions === undefined) {
			return new Set();
		}
	
		return participantRestrictions
	}
	
	setParticipantRestriction(participant1Id, participant2Id) {
		this.validateRestrictionDetails(participant1Id, participant2Id);

		const participant1RestrictionSet = this.getParticipantRestrictons(participant1Id);

		if (participant1RestrictionSet.has(participant2Id)) {
			throw `Esta restrição já existe.`;
		}

		participant1RestrictionSet.add(participant2Id);
	
		this.restrictions.set(participant1Id, participant1RestrictionSet);
	}

	validateRestrictionDetails(p1Id, p2Id) {
		if (p1Id === p2Id) {
			throw `Os participantes não podem ser atribuídos a si próprios, por isso esta restrição não é necessária.`;
		}
	}
	
	removeParticipantRestriction(participant1Id, participant2Id) {
		const participant1RestrictionSet = this.getParticipantRestrictons(participant1Id);
	
		participant1RestrictionSet.delete(participant2Id);

		if (participant1RestrictionSet.size === 0) {
			this.restrictions.delete(participant1Id);
		}
		else {
			this.restrictions.set(participant1Id, participant1RestrictionSet);
		}
	}
	
	async matchParticipants() {
		const pairGenerator = new PairGenerator(this.participants, this.restrictions);
		this.matches = await pairGenerator.match();
	}

	getMatch(participantId) {
		return this.matches.get(participantId);
	}

	async notifyParticipant(participantId) {
		const participant = this.getParticipant(participantId);
		const emailSubject = this.emailMatchSubject();
		const emailBody = this.emailMatchHTML(participant);

		const thisReference = this;

		return new Promise(async function (resolve, reject) {
			participant.wasNotified = false;

			thisReference.sendEmail(participant.email, emailSubject, emailBody).then( response => {
				if (response === 'OK') {
					participant.wasNotified = true;
					resolve();
				}
				else {
					reject(`Erro ao notificar o participante.`);
				}

				thisReference.saveParticipantsToLocalStorage();
			});
		});
	}

	async notifyParticipants() {
		if (this.matches.size === 0) {
			throw `Os participantes ainda não foram atribuídos.`;
		}

		var emailPromises = this.participants.map( p => {
			const emailSubject = this.emailMatchSubject();
			const emailBody = this.emailMatchHTML(p);
			return this.sendEmail(p.email, emailSubject, emailBody);
		});

		const thisReference = this;

		return new Promise(async function (resolve, reject) {
			const startTime = new Date();

			Promise.all(emailPromises).then(async results => {
				await Utilities.waitForMinimumTime(2000, startTime);

				const result = thisReference.processSentEmailResults(results);

				if (result === 'failure') {
					reject(`Erro ao notificar os participantes.`);
				}
				else {
					resolve();
				}

				thisReference.saveParticipantsToLocalStorage();
			});
		})
	}

	emailMatchSubject() {
		return `Ho Ho Ho, o amigo invisível chegou!`;
	}

	emailMatchHTML(participant) {
		const matchId = this.getMatch(participant.id);

		if (matchId === undefined) {
			throw `Erro: o participante ${participant.name} ainda não foi atribuído.`
		}

		const matchParticipant = this.getParticipant(matchId);
		return `
			<p>Para este Natal, vais poder concentrar toda a tua creatividade numa só pessoa.</p>
			<p>Por isso, com +/- 50€, encontra a prenda ideal para o/a <strong>${matchParticipant.name}</strong>!</p>

			<h3>Feliz Natal!</>
			<img src="https://media.giphy.com/media/l0MYN7mdvcZBBpEly/giphy.gif" alt="funny GIF" style="margin-top:32px;">
		`;
	}

	processSentEmailResults(results) {
		const emailsUsed = this.participants.map( p => p.email );
		var failedEmailDeliveries = 0;

		for (var i = 0; i < results.length; i++) {
			const email = emailsUsed[i];
			const participant = this.getParticipantByEmail(email)

			if (results[i] === 'OK') {
				participant.wasNotified = true;
			}
			else {
				failedEmailDeliveries++;
			}
		}

		if (failedEmailDeliveries === 0) {
			return 'success';
		}
		else if (failedEmailDeliveries > 0 && failedEmailDeliveries < this.participants.length) {
			return 'partialSuccess'
		}
		else {
			return 'failure';
		}
	}

	async sendEmail(toEmail, subject, body) {
		return Email.send({
			Host :			'smtp.gmail.com',
			Username :		'noel.secret.2021@gmail.com',
			Password :		'lzoA4Dr&pvkdhEpo1EvV%q#k1rxz20Dy7r4Vm3sQcZLOtMQq*o',
			To:				toEmail,
			From:			'noel.secret.2021@gmail.com',
			Subject:		subject,
			Body:			body
		})
	}

	updateParticipantDetails(participant, name, email) {
		participant.name = name;
		participant.email = email;
		this.saveParticipantsToLocalStorage();
	}

	saveParticipantsToLocalStorage() {
		this.storageService.saveObject('participants', this.participants);
	}

	saveToLocalStorage() {
		this.storageService.saveObject('participants', this.participants);
		this.storageService.saveMapOfSet('restrictions', this.restrictions);
		this.storageService.saveMap('matches', this.matches);
		this.storageService.save('participantCounter', this.participantCounter);
	}

	loadFromLocalStorage() {
		this.participants = this.storageService.getObject('participants');
		this.restrictions = this.storageService.getMapOfSet('restrictions', 'int', 'int');
		this.matches = this.storageService.getMap('matches', 'int');
		this.participantCounter = this.storageService.getInt('participantCounter');
	}

	clearFromLocalStorage() {
		this.storageService.deleteAll();
	}
}