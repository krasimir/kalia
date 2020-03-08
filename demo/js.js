import * as Foo from 'react';

const hello = 'I am never used';
let foo = 'bar';
let why = 42;

console.log(hello, foo)

doesNotExist.nope(`I'm never imported`);

class widget extends React.Component { }

const joe = function () { };

const wes = 100;

function wes() {
	if (wes === foo && wes >= 200) {
		let bar = 20;
		bar += 20;
		return true;
	}
}

const wes = () => { };

console.log(joe, wes);

const assert = require('assert');
const fs = require('fs');

const tests = [];
const code = fs.readFileSync('aaa.js');

function it(name, fn) {
	tests.push({ name, fn });
}
function run() {
	console.log(code);
	tests.forEach(t => {
		try {
			t.fn();
			console.log('✅', t.name);
		} catch (e) {
			console.log('❌', t.name);
			console.log(e.stack);
		}
	})
}

run();

