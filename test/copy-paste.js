import BpmnModeler from 'bpmn-js/lib/Modeler';

import sampleDiagram from './sample.bpmn';

import {
  insertCSS
} from './helper';

import fileDrop from 'file-drops';
import fileOpen from 'file-open';
import download from 'downloadjs';

import fileDropCSS from './file-drops.css';

import diagramCSS from 'bpmn-js/dist/assets/diagram-js.css';
import bpmnCSS from 'bpmn-js/dist/assets/bpmn-js.css';
import bpmnFontCSS from 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css';

import {
  isPaste
} from 'diagram-js/lib/features/keyboard/KeyboardUtil';

insertCSS('file-drops.css', fileDropCSS);

insertCSS('diagram-js.css', diagramCSS);
insertCSS('bpmn-font.css', bpmnFontCSS);
insertCSS('bpmn-js.css', bpmnCSS);


const nativeCopyModule = {
  __init__: [ 'nativeCopyPaste' ],
  nativeCopyPaste: [ 'type', function(
      keyboard, eventBus,
      moddle, clipboard
    ) {

    // persist into system clipboard whenever copy took place
    eventBus.on('copyPaste.elementsCopied', event => {
      const { tree } = event;

      //console.log('Copying to system clipboard', tree);
      navigator.clipboard.writeText(JSON.stringify(tree))
    });


    function handleFocus() {
      navigator.clipboard.readText()
        .then(text => {
          //lacks check if clipboard contents is a vaild serialized diagram

          //console.log('Clipboard contents:', text);
          const parsedCopy = JSON.parse(text, createReviver(moddle));
          clipboard.set(parsedCopy);
        })
        .catch(err => {
          console.error('Failed to read clipboard contents: ', err);
        });
    }

    window.addEventListener('focus', handleFocus);

    eventBus.on('diagram.destroy', () => {
      window.removeEventListener('focus', handleFocus);
    });
  } ]
}


describe('copy-paste', function() {

  it('should copy/paste', async function() {

    const modeler = new BpmnModeler({
      container: testContainer(),
      additionalModules: [
        nativeCopyModule
      ],
      keyboard: {
        bindTo: document.body
      }
    });

    await modeler.importXML(sampleDiagram);

    // with app like behavior
    setupApp(modeler, 'sample.bpmn');
  });

});


/////////////// helpers //////////////////////////

function setupApp(modeler, fileName) {

  function openDiagram(diagram) {
    return modeler.importXML(diagram)
      .then(({ warnings }) => {
        if (warnings.length) {
          console.warn(warnings);
        }
      })
      .catch(err => {
        console.error(err);
      });
  }

  function openFile(files) {

    // files = [ { name, contents }, ... ]

    if (!files.length) {
      return;
    }

    fileName = files[0].name;

    openDiagram(files[0].contents);
  }

  function downloadDiagram() {
    modeler.saveXML({ format: true }, function(err, xml) {
      if (!err) {
        download(xml, fileName, 'application/xml');
      }
    });
  }

  const handleDragOver = fileDrop('Open BPMN diagram', openFile);

  const handleKeys = (event) => {
    if (event.code === 'KeyS' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();

      downloadDiagram();
    }

    if (event.code === 'KeyO' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();

      fileOpen().then(openFile);
    }
  };

  document.body.addEventListener('keydown', handleKeys);
  document.body.addEventListener('dragover', handleDragOver);

  return () => {
    document.body.removeEventListener('keydown', handleKeys);
    document.body.removeEventListener('dragover', handleDragOver);
  };
}

/**
 * A factory function that returns a reviver to be
 * used with JSON#parse to reinstantiate moddle instances.
 *
 * @param  {Moddle} moddle
 *
 * @return {Function}
 */
function createReviver(moddle) {

  var elCache = {};

  /**
   * The actual reviewer that creates model instances
   * for elements with a $type attribute.
   *
   * Elements with ids will be re-used, if already
   * created.
   *
   * @param  {String} key
   * @param  {Object} object
   *
   * @return {Object} actual element
   */
  return function(key, object) {

    if (typeof object === 'object' && typeof object.$type === 'string') {

      var objectId = object.id;

      if (objectId && elCache[objectId]) {
        return elCache[objectId];
      }

      var type = object.$type;
      var attrs = Object.assign({}, object);

      delete attrs.$type;

      var newEl = moddle.create(type, attrs);

      if (objectId) {
        elCache[objectId] = newEl;
      }

      return newEl;
    }

    return object;
  };
}

/**
 * Create a full-screen test container.
 *
 * @return {Element}
 */
function testContainer() {
  var el = document.createElement('div');

  el.style.width = '100%';
  el.style.height = '100vh';
  el.style.margin = '-10px';
  el.style.position = 'absolute';

  document.body.appendChild(el);

  return el;
}