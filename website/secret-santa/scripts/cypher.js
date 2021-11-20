export default class Cypher {
	
	static encode(string) {
		return btoa(string);
	}

	static decode(string) {
		return atob(string);
	}

}