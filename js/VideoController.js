const EventEmitter = require('events');
const SwitcherShader = require('./SwitcherShader');

global.NO_EFFECT = 0.0; // just show the video!
global.MOUSE_FLARE_EFFECT = 1.0; // lens flare at the mouse point
global.MOUSE_BW_EFFECT = 2.0; // a melty hole at the mouse point
global.TEXT_MELT_EFFECT = 3.0; // show the text as melty

class VideoController extends EventEmitter {
  constructor(controller, gl, theWindow) {
    super();
    this.sceneDescription = false;
    this.controller = controller;
    this.theWindow = theWindow;
    this.dimensions = controller.dimensions;
    this.currentVideo = false; // the main video
    this.backgroundVideo = false; // the secondary video
    this.loopVideo = false; // the loop video
    this.lastVideo = false;
    this.nextVideo = false;
    this.videoFetcher = false;
    this.activeObject = false;
    this.switcher = new SwitcherShader(this, gl, controller.dimensions, controller.devMode);
  }

  goUp(val) {
    this.switcher.goUp = val;
  }

  // called when previous video is finished playing, continuously:
  previousEnd() {
    if (this.branching) {
      return this.branchEnd();
    }
    // delete this.currentVideo.onended;
    this.currentVideo = this.activeObject.getNextVideo();
    this.switcher.connectVideo(this.currentVideo.element, true);
    if (this.currentVideo.hasMask) {
      // play mask video for interface controller and as input to the switcher:
      this.switcher.connectMask(this.controller.interfaceController.connectMask(this.currentVideo.maskPath));
    }
    this.currentVideo.element.onended = this.previousEnd.bind(this);
    this.currentVideo.element.play();
  }

  branchEnd() {
    // insert the branch
    this.currentVideo = this.branching.sourceVideo;
    this.switcher.connectVideo(this.currentVideo.element, true);
    const wrapper = () => {
      this.branching.destinationObject.activate(this);
      this.branching = false;
      this.previousEnd();
    };
    this.currentVideo.element.onended = wrapper.bind(this);
    this.currentVideo.element.play();
  }

  branchTo(sourceVideo, destinationObject, type) {
    // play source video
    if (type === 'cut') {
      // when the video is done activate the new object:
      sourceVideo.element.onended = () => {
        destinationObject.activate(this);
        this.controller.branching = false;
      };
      if (this.currentVideo) {
        this.currentVideo.element.onended = undefined;
      }
      this.currentVideo = sourceVideo;
      this.switcher.connectVideo(this.currentVideo.element, true);
      this.currentVideo.element.play();
      return;
    }
    if (type === 'transition') {
      this.branching = { sourceVideo, destinationObject };
      // unset current handler:
      this.currentVideo.element.onended = undefined;
      this.currentVideo.element.onended = this.branchEnd.bind(this);
    }
  }

  previousEndSyncSwitch() {
    const temp = this.backgroundVideo;
    this.backgroundVideo = this.currentVideo;
    this.currentVideo = temp;
    this.switcher.connectVideo(this.currentVideo.element);
    this.currentVideo.muted = 'true';
    this.currentVideo.element.play();
    this.backgroundVideo.element.play();
    // if (this.currentVideo.hasMask) {
    //   this.switcher.connectMask(this.controller.interfaceController.connectMask(this.currentVideo.maskPath));
    // }
    setTimeout(() => {
      this.previousEndSyncSwitch.bind(this)();
    }, 3000);//Math.max(this.sceneDescription.behavior.minCutLength, Math.floor(Math.random() * Math.floor(scene.behavior.maxCutLength))));
  }

  startSyncSwitch(scene) {
    // remove previous element.eventHandler
    if (this.currentVideo) {
      this.currentVideo.element.onended = undefined;
    }
    if (this.backgroundVideo) {
      this.backgroundVideo.element.onended = undefined;
    }
    this.sceneDescription = scene;
    // start first root and first loop
    this.currentVideo = scene.roots[0];
    this.backgroundVideo = scene.loops[0];
    this.switcher.connectVideo(this.currentVideo.element);
    // this.currentVideo.element.onended = this.previousEnd.bind(this);
    this.currentVideo.element.play();
    this.backgroundVideo.element.play();
    // set a timeout to switch to the next one of random length
    // between the min and max:
    setTimeout(() => {
      this.previousEndSyncSwitch.bind(this)();
    }, 2000);// Math.max(scene.behavior.minCutLength, Math.floor(Math.random() * Math.floor(scene.behavior.maxCutLength))));
    if (this.currentVideo.hasMask) {
      this.switcher.connectMask(this.controller.interfaceController.connectMask(this.currentVideo.maskPath));
    }
  }

  // Active object calls this:
  startScene(scene) {
    if (scene.behavior.behavior_type === 'syncSwitch') {
      return this.startSyncSwitch(scene);
    }
    // remove previous element.eventHandler
    if (this.currentVideo) {
      this.currentVideo.element.onended = undefined;
    }
    this.sceneDescription = scene;
    this.currentVideo = this.activeObject.getNextVideo();
    this.switcher.connectVideo(this.currentVideo.element, true);
    this.currentVideo.element.onended = this.previousEnd.bind(this);
    this.currentVideo.element.play();
    if (this.currentVideo.hasMask) {
      this.switcher.connectMask(this.controller.interfaceController.connectMask(this.currentVideo.maskPath));
    }
  }

  // get time remaining in current video:
  getRemainingTime() {
    return this.currentVideo.element.duration - this.currentVideo.element.currentTime;
  }

  showPartial(partial, index, callback) {
    partial.element.play();
    this.switcher.connectPartial.bind(this.switcher)(partial, index, callback);
  }
}

module.exports = VideoController;
