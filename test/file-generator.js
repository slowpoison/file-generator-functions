'use strict';
const fsp = require('fs').promises;
const assert = require('assert');

const FileGenerator = require('../file-generator');
describe('FileGenerator', function() {
    it('should generate lines', async function() {
      let fileGen = new FileGenerator('test/lines.txt');
      let lines = [];
      for await (let line of fileGen.genLines()) {
        lines.push(line);
      }

      fsp.open('test/lines.txt', 'r')
        .then(fh => fh.readFile())
        .then(fileLines => assert.equal(fileLines.toString(), lines.join('')));
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
