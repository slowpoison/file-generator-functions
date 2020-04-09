'use strict';
const fsp = require('fs').promises;
const assert = require('assert');

const FileGenerator = require('../file-generator');
describe('FileGenerator', function() {
      it('should generate lines', async function() {

        let fileContent = await fsp.open('test/lines.txt', 'r')
          .then(fh => fh.readFile())
          .then(buf => buf.toString());

        let bufferLengths = [1, 2, 1024];
        bufferLengths.map(async bufferLength => {
          let fileGen = new FileGenerator(
              'test/lines.txt', {initialBufferLength: bufferLength});
          let lines = [];
          for await (let line of fileGen.genLines()) {
            lines.push(line);
          }
          assert.equal(fileContent, lines.join(''), 'buffer size ' + bufferLength);
          });
        });

      it('should generate lines without trailing newline when configured so', async function() {
        let fileGen = new FileGenerator('test/lines.txt', {includeNewlines: false});
        let lines = [];
        for await (let line of fileGen.genLines()) {
          lines.push(line);
        }

        fsp.open('test/lines.txt', 'r')
          .then(fh => fh.readFile())
          .then(fileLines =>
              assert.equal(fileLines.toString(), lines.join("\n") + "\n"));
        });
    });
