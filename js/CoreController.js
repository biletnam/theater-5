'use strict';
const VideoController = require('./VideoController');
const AudioController = require('./AudioController');
const InterfaceController = require('./InterfaceController');

const Module = require('../modules/IrisOne/js/the_repository_1.js');

class CoreController {
  constructor(options) {
    this.theWindow = options.theWindow;
    this.$ = options.$;
    this.devMode = options.devMode;
    this.dimensions = options.dimensions;
    this.currentSceneDescription = {};
    this.currentSceneVideo = {};

    this.hitboxCanvas = options.hitboxCanvas;
    this.finalDestinationCanvas = options.finalDestinationCanvas;
    this.textCanvas = options.textCanvas;
    this.textCanvas.width = this.finalDestinationCanvas.width;
    this.textCanvas.height = this.finalDestinationCanvas.height;

    this.gl = this.finalDestinationCanvas.getContext('webgl');
    this.textContext = this.textCanvas.getContext('2d');
    this.audioController = new AudioController(options.$);
    this.videoController = new VideoController(this, this.gl, options.theWindow);
    this.interfaceController = new InterfaceController(this);

    // this loads any module:
    // const Module = require(modulePath);
    this.gameObjects = {};
    this.module = new Module(this);
    this.activeObject = null;
    this.branching = false;
    this.gameState = {
      meta: {
        started: false
      }
    };
  }

  goUp(val) {
    this.videoController.goUp(val);
  }

  drawText(msg, options = {}) {
    this.textContext.clearRect(0, 0, this.textCanvas.width, this.textCanvas.height);
    this.textContext.fillStyle = options.fillStyle || '#FFFFFF'; 	// This determines the text colour, it can take a hex value or rgba value (e.g. rgba(255,0,0,0.5))
    this.textContext.textAlign = options.textAlign || 'center';	// This determines the alignment of text, e.g. left, center, right
    this.textContext.textBaseline = options.textBaseline || 'middle';	// This determines the baseline of the text, e.g. top, middle, bottom
    this.textContext.font = options.font || '32px monospace';	// This determines the size of the text and the font family used
    this.textContext.fillText(msg, options.x || 300, options.y || 300);
    this.videoController.switcher.connectText(this.textCanvas, options.textEffect);
  }

  hideText() {
    this.textContext.clearRect(0, 0, this.textCanvas.width, this.textCanvas.height);
  }

  // modules will take over the video controller here
  kickstart(gameId, userId) {
    this.module.controller = this;
    this.module.startNewGame(userId);
  }

  loadGameObject(gameObject) {
    // deactivate old object:
    if (this.activeObject) {
      this.activeObject.deactivate();
    }
    this.activeObject = gameObject;
    gameObject.activate(this.videoController);
    // todo: this.audiController.setActiveObject(gameObject);
  }

  // branch to a new Game Object:
  // todo: this will eventually need to dynamically load
  branchTo(sourceVideo, destinationObjectName, transitionType) {
    const destinationObject = this.gameObjects[destinationObjectName];
    this.branching = { sourceVideo, destinationObject };
    this.videoController.branchTo(sourceVideo, destinationObject, transitionType);
  }

  deactivateEffect() {
    this.videoController.switcher.deactivateEffect();
  }

  activateEffect(info) {
    if (info.duration === 'remainingTime') {
      // need to play remaining time plus some
      // play the effect until the end of the video then transfer to next video
      info.duration = 2000.0 + this.videoController.getRemainingTime();
    }
    if (info.when === 'videoEnd') {
      info.when = this.videoController.getRemainingTime();
      console.log(info.when);
    }
    if (info.when && info.callback) {
      setTimeout(info.callback.bind(this), info.when);
    }
    this.videoController.switcher.activateEffect(info);
  }

  toggleDevMode() {
    this.devMode = this.devMode === 1.0 ? 0.0 : 1.0;
    this.videoController.switcher.setShaderVariable('u_debugMode', this.devMode);
  }

  mouseMiss(mouseEvent, timestamp) {
    // todo: play a sound
    this.videoController.mouseMiss(mouseEvent, timestamp);
  }
}
if (module) {
  module.exports = CoreController;
}
