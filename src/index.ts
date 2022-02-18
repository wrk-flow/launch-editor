import * as fs from 'fs';
import { parseFile, logToDebug } from './utils';
import guessEditor from './guessEditor';
import openEditor from './openEditor';
import EditorError from './error';
import { IResult, IOptions } from './types';
import { ERROR_CODE, SUPPORTED_EDITTORS } from './enum';

const launchEditor = async (
  file: string,
  options: IOptions = {}
): Promise<IResult> => {
  if (typeof options.log === 'undefined') {
    options.log = logToDebug
  }

  const { editor, log } = options;

  const { fileName, lineNumber, colNumber } = parseFile(file);
  if (!fs.existsSync(fileName)) {
    return {
      success: false,
      message: `fileName: ${fileName} does not exist`
    };
  }

  const aliasEditor = SUPPORTED_EDITTORS[editor];

  // Throwing an error if the user specified editor is not found
  if (!aliasEditor) {
    throw new EditorError({
      editor: editor || 'UNKNOW',
      success: false,
      code: ERROR_CODE.UNKNOWN
    });
  }

  const guessedEditor = guessEditor(aliasEditor, log);

  // Throwing an error if guessEditor returns undefined
  if (!guessedEditor) {
    throw new EditorError({
      editor: editor || 'UNKNOW',
      success: false,
      code: ERROR_CODE.UNKNOWN
    });
  }
  const { name, commands } = guessedEditor;

  log('guessedEditor name', name);
  log('guessedEditor commands', commands);

  const params = {
    fileName,
    lineNumber,
    colNumber,
    stdout: options.stdout || 'inherit',
  };

  const res = await openEditor({
    name,
    commands,
    log,
    ...params
  });

  log('launchEditor result', res);

  return res;
};

export = launchEditor;
