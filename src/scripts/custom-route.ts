import fs from 'fs';
import path from 'path';

interface QueryParams {
  [key: string]: unknown;
}

interface CLIParams {
  modelName: string;
  existingRepo: string;
  httpMethod: string;
  newMethod: string;
  params: string;
  sqlQuery: string;
}

function capitalize(s: string) {
  return s[0].toUpperCase() + s.slice(1);
}

function lowerCase(s: string) {
  return s[0].toLowerCase() + s.slice(1);
}

function getQuery() {
  const cliParams: CLIParams = <any>{};
  const {argv} = process;
  const args = argv.slice(2, argv.length);
  if (!args.length) {
    throw Error('Parameters are required.');
  }
  args.forEach(arg => {
    const argument = arg.split('=');
    const value = argument[1];
    let argumentFlag = '';
    let sliceUpto = 0;
    if (arg[0] === '-') sliceUpto = 1;
    if (arg.slice(0, 2) === '--') sliceUpto = 2;
    argumentFlag = argument[0].slice(sliceUpto, argument[0].length);
    if (argumentFlag === 'modelName') cliParams.modelName = value;
    if (argumentFlag === 'existingRepo') cliParams.existingRepo = value;
    if (argumentFlag === 'httpMethod') cliParams.httpMethod = value;
    if (argumentFlag === 'newMethod') cliParams.newMethod = value;
    if (argumentFlag === 'params') cliParams.params = value;
    if (argumentFlag === 'sqlQuery') cliParams.sqlQuery = value;
  });
  return cliParams;
}

(() => {
  const cliParams = getQuery();
  const {sqlQuery, modelName, existingRepo, httpMethod, newMethod} = cliParams;
  const params = cliParams.params.split(',') || [];
  const inputParams: QueryParams = {};
  let queryMethod = '';
  switch (httpMethod) {
    case 'get':
      queryMethod = 'find';
      break;
    case 'post':
      queryMethod = 'create';
      break;
  }
  params.forEach((param: string) => {
    const paramParts = param.split(':');
    inputParams[paramParts[0]] = paramParts[1] as unknown as string;
  });
  const imports = `import {${capitalize(modelName)}} from '../models';
import {${capitalize(existingRepo)}} from '../repositories';
import {repository} from '@loopback/repository';
import {get, getModelSchemaRef, param, requestBody, response} from '@loopback/rest';
  `;
  const constructor = `constructor(@repository(${capitalize(existingRepo)})
  public ${lowerCase(existingRepo)}: ${capitalize(existingRepo)},) {}`;
  const customRoute = `@${httpMethod}('/${newMethod}')
  @response(200, {
    description: '${capitalize(modelName)} custom model instance',
    content: {'application/json': {schema: getModelSchemaRef(${capitalize(
      modelName,
    )})}},
  })
  async ${queryMethod}(): Promise<unknown> {
    return this.${lowerCase(existingRepo)}.execute('${sqlQuery}');
  }
  `;
  const controller = `${imports}
export class ${capitalize(modelName)}Controller {
  ${constructor}

  ${customRoute}
}`;
  fs.writeFile(
    path.join(
      __dirname,
      `../../src/controllers/custom-${newMethod}.controller.ts`,
    ),
    controller,
    err => {
      if (err) throw err;
      fs.appendFile(
        path.join(__dirname, `../../src/controllers/index.ts`),
        `export * from './custom-${newMethod}.controller';`,
        error => {
          if (error) throw error;
        },
      );
    },
  );
  console.log(`*************custom-${newMethod}.controller.ts*************`);
  console.log(controller);
  console.log(`*************custom-${newMethod}.controller.ts*************`);
})();
