import Utilities from "../scripts/utilities.js";

export default class PairGenerator {
	matches = new Map();

	constructor(participants, restrictions) {
		this.participants = participants;
		this.restrictions = restrictions;
	}

	getMatches() {
		return this.matches;
	}

	async match() {
		let counter = 0;
		const startTime = new Date();

		while (this.matches.size < this.participants.length && counter < 100) {
			let randomParticipant = undefined;

			if (this.shouldPrioritizeParticipants()) {
				randomParticipant = this.getRandomUnmatchedParticipantPrioritizedByRestrictions();
			}
			else {
				randomParticipant = this.getRandomUnmatchedParticipant();
			}

			const eligibleMatches = this.getEligibleMatchesForParticipant(randomParticipant);

			if (eligibleMatches.length === 0) {
				throw `Could not find a valid match for ${randomParticipant.name}`;
			}

			const randomMatch = this.getRandomMarticipantFromArray(eligibleMatches);
			this.setParticipantMatch(randomParticipant, randomMatch);

			counter++;
		}

		await Utilities.waitForMinimumTime(2000, startTime);
		return this.matches;
	}

	shouldPrioritizeParticipants() {
		const unmatchedParticipants = this.participants.filter( p => !this.matches.has(p.id) );
		const participantsWithRestrictions = unmatchedParticipants.filter( p => this.restrictions.has(p.id) );
		return participantsWithRestrictions.length > 0;
	}

	getRandomUnmatchedParticipant() {
		let unmatchedParticipants = this.participants.filter( p => !this.matches.has(p.id) );
		Utilities.shuffle(unmatchedParticipants);
		return unmatchedParticipants[0];
	}

	getRandomUnmatchedParticipantPrioritizedByRestrictions() {
		let unmatchedParticipants = this.participants.filter( p => !this.matches.has(p.id) );
		let unmatchedParticipantsWithRestrictions = unmatchedParticipants.filter( p => this.restrictions.get(p.id) );

		Utilities.shuffle(unmatchedParticipantsWithRestrictions);
		return unmatchedParticipantsWithRestrictions[0];
	}

	getRandomMarticipantFromArray(participants) {
		const randomIndex = Math.floor(Math.random() * participants.length);
		return participants[randomIndex];
	}

	setParticipantMatch(participant, matchedParticipant) {
		this.matches.set(participant.id, matchedParticipant.id);
	}

	getEligibleMatchesForParticipant(participant) {
		const restrictionSet = this.restrictions.get(participant.id);
		const matchedParticipantsSet = new Set(this.matches.values());

		const eligibleMatches = this.participants.filter( p => {
			let isEligible = true;

			if (p.id === participant.id ) {
				isEligible = false;
			}
			else if (restrictionSet !== undefined && restrictionSet.has(p.id)) {
				isEligible = false;
			}
			else if (matchedParticipantsSet.has(p.id)) {
				isEligible = false;
			}
			
			return isEligible;
		});

		return eligibleMatches;
	}
}