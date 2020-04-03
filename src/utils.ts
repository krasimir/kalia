export function indent(spaces:number):string {
  let str = '';
  for(let j=0; j<spaces; j++) {
    str += '  ';
  }
  return str;
}