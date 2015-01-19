'use strict';

export module helloworld_module {
	export class HelloWorld {
		constructor (public word: string = "serif") {}
		sayit () {
			console.log('Hello ' + this.word)
		}
	}
}
