const Task = require('./../../../util/task.js');
const fs = require('fs');

const images = "./images/yuki/";
const options = {
  "id": "yuki",
}

module.exports = class extends Task {
  constructor(domain) {
    super(domain, options);
  }

  supports(message) {
    const content = message.content.toLowerCase().split(" ");

    if (content[0] === `!${this.id}`) {
      return true;
    }
    return false;
  }

  execute(message) {
    const channel = message.channel;

    channel.startTyping();
    fs.readdir(images, (err, files) => {
      if (err) {
        console.trace(err);
      } else {
        const name = this.domain.modules.random.pick(files);

        channel.sendFile(images+name, name)
        .then(() => {
          channel.stopTyping();
        })
        .catch((err) => {
          channel.stopTyping();
          console.log(err);
        })
      }
    });
  }

  help(text) {

  }
}