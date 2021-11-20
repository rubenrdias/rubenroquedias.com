export default class Participant {
	constructor(id, name, email, wasNotified = false) {
		this.id = id;
		this.name = name;
		this.email = email;
		this.wasNotified = wasNotified;
	}
}