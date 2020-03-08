/* A comment */
// Another comment

const answerA = 42;
let answerB = "hello world";
var answerC = "Hey";
const result = 40 + 100;
const isItTrue = 100 > 20;

const getAnswerA = function (name) {
  return `Hey ${name}`;
}
function getAnswerB() {
  const transform = (n) => {
    return n.toUpperCase();
  }
  return 'Hey, ' + transform('Steve');
}
class Test extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return <p>Hello world</p>;
  }
}