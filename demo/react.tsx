import * as React from "React";

// This is a test comment
/*
  and a block comment
*/

export class App extends React.Component {
  public foo: string = "Hello world 22";

  public render() {
    return (
      <div className="App">
        <header className="App-header">
          <h1 className="App-title">{this.foo}</h1>
        </header>
      </div>
    );
  }
}

function utilityFunction(n:number):void {
  const answer = 42;
  console.log(answer);
  console.log('foo' + `n:${n} ${answer}`);
}
