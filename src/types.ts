import EditorError from './error';
import { IEditor } from './enum';
import { StdioOptions } from "child_process";

export type Log = (...args) => void;

export interface IOptions {
  editor?: IEditor;
  editorOpts?: string[];
  stdout?: StdioOptions;
  log?: Log;
}

interface IResultSuccess {
  success: boolean;
  editorBin?: string;
  message?: string;
}

export type IResult = IResultSuccess | EditorError | {} | undefined;
