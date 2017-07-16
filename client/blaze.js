import {ReactiveVar} from 'meteor/reactive-var';

Template['blaze-template'].onCreated(function () {
  this.timestamp = new ReactiveVar(new Date().toString());

  this.interval = Meteor.setInterval(() => {
    this.timestamp.set(new Date().toString());
  }, 1000);
});

Template['blaze-template'].onDestroyed(function () {
  if (this.interval) {
    Meteor.clearInterval(this.interval);
    this.interval = null;
  }
});

Template['blaze-template'].helpers({
  props() {
    return {
      timestamp: Template.instance().timestamp.get(),
    };
  },
});