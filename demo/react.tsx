// @ts-nocheck

import * as React from "React";

export class App extends React.Component {
  public foo: string = "Hello world";

  // rendering the component
  public render() {
    return (
      <div className="App">
        <header className="App-header">
          <h1 className="App-title-class">
            {this.foo}
          </h1>
        </header>
      </div>
    );
  }
}

function formatName(name:string):void {
  const normalized = name.toUpperCase();
  console.log(`Hey, ${normalized}`);
}
